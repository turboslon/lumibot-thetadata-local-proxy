
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
    try {
        // 1. Get Expirations
        console.log('Fetching expirations for AAPL...');
        // V3: use symbol=AAPL, format=json
        const expRes = await fetch(`${THETADATA_BASE_URL}/v3/option/list/expirations?symbol=AAPL&format=json`, {
            headers: { 'Accept': 'application/json' }
        });

        if (expRes.status !== 200) {
            throw new Error(`Failed to fetch expirations: ${expRes.status} ${await expRes.text()}`);
        }

        const expData = await expRes.json();
        const expirations = expData.response; // V3 returns objects like { "expiration": "2024-01-01", ... }

        if (!expirations || expirations.length === 0) throw new Error('No expirations found');

        // Pick a recent expiration (e.g., 5th from last to avoid very newly listed ones or potential issues)
        // Pick a recent past expiration (e.g. 2024 or 2025) to satisfy Value subscription
        // Filter for 2024 or 2025
        const recentExps = expirations.filter((e: any) => {
            const s = typeof e === 'object' ? e.expiration : e;
            return String(s).startsWith('2024') || String(s).startsWith('2025');
        });

        // Pick one from the middle of the recent ones
        if (recentExps.length === 0) console.warn('No 2024/2025 expirations found, using random one.');
        const pool = recentExps.length > 0 ? recentExps : expirations;
        const expItem = pool[Math.floor(pool.length / 2)];

        // Extract date string. Assuming it's an object with 'expiration' or 'date' property, or just the value.
        // Based on previous logs: [{"symbol":"AAPL","expiration":"2012-06-01"}]
        const expDateStr = typeof expItem === 'object' ? expItem.expiration : expItem;
        // Remove dashes for API calls
        const exp = String(expDateStr).replace(/-/g, '');
        console.log(`Selected Expiration: ${exp} (from ${JSON.stringify(expItem)})`);

        // 2. Get Strikes for that Expiration
        console.log(`Fetching strikes for AAPL exp ${exp}...`);
        // V3: use expiration instead of exp
        const strikeRes = await fetch(`${THETADATA_BASE_URL}/v3/option/list/strikes?symbol=AAPL&expiration=${exp}&format=json`, {
            headers: { 'Accept': 'application/json' }
        });

        if (strikeRes.status !== 200) {
            throw new Error(`Failed to fetch strikes: ${strikeRes.status} ${await strikeRes.text()}`);
        }

        const strikeData = await strikeRes.json();
        const strikes = strikeData.response;

        if (!strikes || strikes.length === 0) throw new Error('No strikes found');

        // Pick a strike in the middle (likely At-The-Moneyish)
        const strikeIndex = Math.floor(strikes.length / 2);
        const strikeItem = strikes[strikeIndex];
        // strikes usually come as numbers or simple objects in V3 list? 
        // If list/expirations returns objects, list/strikes might too.
        // Let's assume object { strike: ... } or value.
        const strikeVal = typeof strikeItem === 'object' ? strikeItem.strike : strikeItem;
        const strike = String(strikeVal);
        console.log(`Selected Strike: ${strike}`);

        // 3. Fetch OHLC
        // Determine date range relative to expiration to ensure data exists.
        // Let's look at 10 to 5 days before expiration.
        const year = parseInt(exp.substring(0, 4));
        const month = parseInt(exp.substring(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(exp.substring(6, 8));

        const d = new Date(year, month, day);

        // Start = Exp - 10 days
        const startDate = new Date(d);
        startDate.setDate(startDate.getDate() - 10);

        // End = Exp - 5 days
        const endDate = new Date(d);
        endDate.setDate(endDate.getDate() - 5);

        const fmt = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');
        const start = fmt(startDate);
        const end = fmt(endDate);

        console.log(`Fetching OHLC for range: ${start} - ${end}`);

        const endpoint = '/v3/option/history/ohlc';
        const queryParams = {
            // V3 seems to strictly enforce symbol/expiration now
            symbol: 'AAPL',
            expiration: exp,
            strike: strike,
            right: 'C',
            date: start, // Trying 'date' parameter
            // start: start,
            // end: end,
            interval: '1h',
            format: 'json'
        };

        const url = new URL(endpoint, THETADATA_BASE_URL);
        Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

        console.log(`Fetching: ${url.toString()}`);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' } // Explicitly asking for JSON
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
        const fixtureDir = path.join(__dirname, '../../test/fixtures/option-history-ohlc');
        fs.mkdirSync(fixtureDir, { recursive: true });

        fs.writeFileSync(
            path.join(fixtureDir, 'captured-data.json'),
            JSON.stringify(captured, null, 2)
        );

        console.log(`Saved to: ${fixtureDir}/captured-data.json`);
        console.log(`Response status: ${response.status}`);

        if (response.status !== 200) {
            console.warn(`Warning: Response status is not 200. Body: ${rawText.substring(0, 300)}`);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchAndCapture().catch(console.error);
