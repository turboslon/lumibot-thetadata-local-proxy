/**
 * Fetch Sample Data Script: Terminal Status Check
 * 
 * Calls ThetaData Terminal directly and stores raw request/response.
 * 
 * Usage: npx ts-node scripts/fetch-sample-data/fetch-terminal-status.ts
 */

import fs from 'fs';
import path from 'path';

const THETADATA_BASE_URL = process.env.THETADATA_BASE_URL || 'http://127.0.0.1:25510';

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
    const endpoint = '/v3/terminal/mdds/status';
    const queryParams = {
        // format: 'json'
    };

    const url = new URL(endpoint, THETADATA_BASE_URL);
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

    console.log(`Fetching: ${url.toString()}`);

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                // 'Accept': 'application/json' 
            }
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
        const fixtureDir = path.join(__dirname, '../../test/fixtures/terminal-status-check');
        fs.mkdirSync(fixtureDir, { recursive: true });

        fs.writeFileSync(
            path.join(fixtureDir, 'captured-data.json'),
            JSON.stringify(captured, null, 2)
        );

        console.log(`Saved to: ${fixtureDir}/captured-data.json`);
        console.log(`Response status: ${response.status}`);
    } catch (error) {
        console.error('Error fetching data:', error);
        process.exit(1);
    }
}

fetchAndCapture().catch(console.error);
