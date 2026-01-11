/**
 * Fetch Sample Data Script: Option List Dates Quote
 * 
 * Calls ThetaData Terminal directly and stores raw request/response.
 * 
 * Usage: bun scripts/fetch-sample-data/fetch-option-list-dates-quote.ts
 */

import fs from 'fs';
import path from 'path';

const THETADATA_BASE_URL = (process.env.THETADATA_BASE_URL || 'http://127.0.0.1:25503').replace(/\/$/, '');

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
    const endpoint = '/v3/option/list/dates/quote';
    const queryParams = {
        symbol: 'AAPL',
        expiration: '20240419',
        format: 'json'
    };

    const url = new URL(endpoint, THETADATA_BASE_URL);
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

    console.log(`Fetching: ${url.toString()}`);

    try {
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
        const fixtureDir = path.join(__dirname, '../../test/fixtures/option-list-dates-quote');
        if (!fs.existsSync(fixtureDir)) {
            fs.mkdirSync(fixtureDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(fixtureDir, 'captured-data.json'),
            JSON.stringify(captured, null, 2)
        );

        console.log(`Saved to: ${fixtureDir}/captured-data.json`);
        console.log(`Response status: ${response.status}`);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        process.exit(1);
    }
}

fetchAndCapture().catch(console.error);
