/**
 * Fetch Sample Data Script: Stock History EOD
 * 
 * Calls ThetaData Terminal directly and stores raw request/response.
 * 
 * Usage: npx ts-node scripts/fetch-sample-data/fetch-stock-eod.ts
 */

import fs from 'fs';
import path from 'path';

const THETADATA_BASE_URL = process.env.THETADATA_BASE_URL || 'http://127.0.0.1:25503';

interface CapturedData {
    timestamp: string;
    request: {
        url: string;
        method: string;
        headers: Record<string, string>;
        queryParams: Record<string, string>;
    };
    response: {
        status: number;
        headers: Record<string, string>;
        body: unknown;
        rawText: string;
    };
}

async function fetchAndCapture(): Promise<void> {
    const endpoint = '/v3/stock/history/eod';
    const queryParams = {
        symbol: 'AAPL',
        start_date: '20240101',
        end_date: '20240110',
        format: 'json',
        adjust: 'splits',
        include_nbbo: 'true'
    };

    const url = new URL(endpoint, THETADATA_BASE_URL);

    // Note: The script uses 'root' here, but the handler will map it to 'symbol' if the V3 API requires 'symbol'.
    // However, for the capture script, we want to see what the *Server* accepts.
    // The documentation says V3 uses `root` for EOD? Wait, let's check what OHLC did.
    // OHLC capture script used 'root' in queryParams object but url.searchParams.set(k, v)
    // If V3 expects 'symbol', I should probably send 'symbol' or 'root' depending on what I want to test.
    // BUT, the capture script is supposed to capture valid V3 interactions. 
    // Let's assume V3 expects 'root' based on the docs provided in step 15 (stock-history-eod.md says 'root').
    // If it turns out V3 expects 'symbol' (like generic V3), I might get an error and have to adjust.
    // Let's try following the docs first.

    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

    console.log(`Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    const rawText = await response.text();
    let body: unknown;
    try {
        body = JSON.parse(rawText);
    } catch {
        body = rawText;
    }

    const captured: CapturedData = {
        timestamp: new Date().toISOString(),
        request: {
            url: url.toString(),
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            queryParams
        },
        response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body,
            rawText
        }
    };

    // Save to fixtures
    const fixtureDir = path.join(__dirname, '../../test/fixtures/stock-history-eod');
    fs.mkdirSync(fixtureDir, { recursive: true });

    fs.writeFileSync(
        path.join(fixtureDir, 'captured-data.json'),
        JSON.stringify(captured, null, 2)
    );

    console.log(`Saved to: ${fixtureDir}/captured-data.json`);
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', JSON.stringify(body, null, 2));
}

fetchAndCapture().catch(console.error);
