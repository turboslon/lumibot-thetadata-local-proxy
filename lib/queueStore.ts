
import { Buffer } from 'node:buffer';

export interface QueueItem {
    requestId: string;
    correlationId: string;
    method: string;
    path: string;
    queryParams: Record<string, any>;
    headers: Record<string, string>;
    body: string | null; // base64
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead';
    result: any | null;
    resultStatusCode: number | null;
    error: string | null;
    retryAfter?: number;
    queuePosition?: number;
    estimatedWait?: number;
    attempts: number;
    createdAt: number;
}

// In-memory store
// Note: In Next.js dev mode this might reset on file changes, but for a running server it persists.
const requestStore = new Map<string, QueueItem>();
const correlationIndex = new Map<string, string>();

function getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

// Default to local ThetaData Terminal
// Ensure trailing slash is handled or not duplicated
const THETADATA_BASE_URL = getEnvVar('THETADATA_BASE_URL');

import { RequestHandlerFactory } from './factory/RequestHandlerFactory';

export function getStats() {
    const values = Array.from(requestStore.values());
    return {
        requests_total: requestStore.size,
        pending: values.filter(i => i.status === 'pending').length,
        processing: values.filter(i => i.status === 'processing').length,
        completed: values.filter(i => i.status === 'completed').length,
        failed: values.filter(i => i.status === 'failed' || i.status === 'dead').length,
    };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let isProcessing = false;
let cleanupInterval: NodeJS.Timeout | null = null;

function startBackgroundProcesses() {
    if (!cleanupInterval) {
        // Run cleanup every 10 minutes
        cleanupInterval = setInterval(cleanupStaleRequests, 10 * 60 * 1000);
    }

    if (!isProcessing) {
        processQueueLoop();
    }
}

function cleanupStaleRequests() {
    const NOW = Date.now();
    const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    for (const [id, item] of requestStore.entries()) {
        if (NOW - item.createdAt > STALE_THRESHOLD) {
            requestStore.delete(id);
            if (item.correlationId) {
                correlationIndex.delete(item.correlationId);
            }
        }
    }
}

export function getRequest(requestId: string) {
    const item = requestStore.get(requestId);
    return item;
}

export function submitRequest(payload: any): QueueItem {
    const { correlation_id, method, path, query_params, headers, body } = payload;

    // Idempotency check
    if (correlation_id && correlationIndex.has(correlation_id)) {
        const existingId = correlationIndex.get(correlation_id)!;
        const existing = requestStore.get(existingId);
        if (existing) return existing;
    }

    const requestId = crypto.randomUUID();
    const item: QueueItem = {
        requestId,
        correlationId: correlation_id || requestId,
        method: method || 'GET',
        path,
        queryParams: query_params || {},
        headers: headers || {},
        body: body || null,
        status: 'pending',
        result: null,
        resultStatusCode: null,
        error: null,
        attempts: 0,
        createdAt: Date.now(),
        // Simple queue position calculation
        queuePosition: Array.from(requestStore.values()).filter(i => i.status === 'pending').length + 1
    };

    requestStore.set(requestId, item);
    if (correlation_id) {
        correlationIndex.set(correlation_id, requestId);
    }

    // Ensure background processing is running
    startBackgroundProcesses();

    return item;
}

async function processQueueLoop() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        while (true) {
            const pendingParams = Array.from(requestStore.values())
                .filter(i => i.status === 'pending')
                .sort((a, b) => a.createdAt - b.createdAt);

            if (pendingParams.length > 0) {
                const nextItem = pendingParams[0];
                await processItem(nextItem);
            } else {
                // Sleep if empty to avoid busy-wait
                await sleep(50);
            }
        }
    } catch (err) {
        console.error("Queue loop crashed, restarting...", err);
        isProcessing = false;
        // Retry logic could go here, or just let next submitRequest restart it
    } finally {
        isProcessing = false;
    }
}

async function processItem(item: QueueItem) {
    item.status = 'processing';
    item.attempts += 1;

    // Update store (not strictly necessary with object reference but good practice)
    requestStore.set(item.requestId, item);

    try {
        // Handle base url logic for factory
        let baseUrl = THETADATA_BASE_URL;
        // Strip trailing slash if present to avoid double slashes when joining
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        const handlerFactory = new RequestHandlerFactory(baseUrl);

        // Normalize path for matching:
        // 1. Remove query params
        // 2. Trim whitespace
        // 3. Remove trailing slashes (unless root path)
        let matchPath = (item.path || '').split('?')[0].trim();
        if (matchPath.length > 1 && matchPath.endsWith('/')) {
            matchPath = matchPath.replace(/\/+$/, '');
        }

        const handler = handlerFactory.getHandler(matchPath);

        if (handler) {
            console.log(`Using handler: ${handler.handlerId} for path: ${item.path}`);

            const result = await handler.execute({
                method: item.method,
                path: item.path,
                queryParams: item.queryParams,
                headers: item.headers,
                body: item.body
            });

            item.result = result.body;
            item.resultStatusCode = result.statusCode;
            item.status = result.error ? 'failed' : 'completed';
            item.error = result.error || null;

            if (item.status === 'completed') {
                console.log("===")
                console.log(`Request ${item.requestId} completed via handler ${handler.handlerId} with status ${item.resultStatusCode}. Data: ${JSON.stringify(item.result)}`);
            } else {
                console.error(`Request ${item.requestId} failed via handler ${handler.handlerId}: ${item.error}`);
            }
            return;
        }

        // No handler found - HARD FAIL instead of proxying
        const registeredHandlers = handlerFactory.getRegisteredHandlers();
        console.error(`=== NO HANDLER FOUND ===`);
        console.error(`Request ID: ${item.requestId}`);
        console.error(`Method: ${item.method}`);
        console.error(`Path: ${item.path}`);
        console.error(`Normalized Match Path: ${matchPath}`);
        console.error(`Query Params: ${JSON.stringify(item.queryParams)}`);
        console.error(`Headers: ${JSON.stringify(item.headers)}`);
        console.error(`Registered Handlers: ${registeredHandlers.join(', ')}`);
        console.error(`=========================`);

        item.error = `No handler found for path: ${item.path} (normalized: ${matchPath}). Registered handlers: ${registeredHandlers.join(', ')}`;
        item.status = 'failed';
        item.resultStatusCode = 500;
        item.result = null;

    } catch (e: any) {
        console.error(`Request ${item.requestId} failed:`, e);
        item.error = String(e);
        item.status = 'failed';
        item.resultStatusCode = 500;
    }
}
