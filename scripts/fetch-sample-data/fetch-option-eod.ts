
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
    const endpoint = '/v3/option/history/eod';
    // Example parameters for a common option, e.g., SPY or AAPL. 
    // We need a valid option contract. 
    // Using AAPL for demonstration, might need adjustment for valid dates/strikes.
    // Assuming a recent date close to 'now' or a known historical date.
    // Let's try to get something from a bit back to ensure data exists.
    // We'll use a widely traded expire.

    const queryParams = {
        symbol: 'AAPL',
        expiration: '20250117',
        strike: '220', // Decimal for V3
        right: 'C',
        start_date: '20241101',
        end_date: '20241110',
        format: 'json'
    };

    const url = new URL(endpoint, THETADATA_BASE_URL);
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
    const fixtureDir = path.join(__dirname, '../../test/fixtures/option-history-eod');
    fs.mkdirSync(fixtureDir, { recursive: true });

    fs.writeFileSync(
        path.join(fixtureDir, 'captured-data.json'),
        JSON.stringify(captured, null, 2)
    );

    console.log(`Saved to: ${fixtureDir}/captured-data.json`);
    console.log(`Response status: ${response.status}`);
    console.log('Body snippet:', JSON.stringify(body).slice(0, 200));
}

fetchAndCapture().catch(console.error);
