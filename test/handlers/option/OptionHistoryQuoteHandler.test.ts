import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionHistoryQuoteHandler } from '../../../lib/handlers/option/OptionHistoryQuoteHandler';
import fixtureData from '../../fixtures/option-history-quote/captured-data.json';

describe('OptionHistoryQuoteHandler', () => {
    let handler: OptionHistoryQuoteHandler;
    const baseUrl = 'http://127.0.0.1:25503';

    beforeEach(() => {
        handler = new OptionHistoryQuoteHandler(baseUrl);
    });

    describe('canHandle', () => {
        it('should match V3 path', () => {
            expect(handler.canHandle('/v3/option/history/quote')).toBe(true);
        });

        it('should match path without slash', () => {
            expect(handler.canHandle('option/history/quote')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/quote')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should map query params correctly', async () => {
            const request = {
                method: 'GET',
                path: '/v3/option/history/quote',
                queryParams: {
                    root: 'AAPL',
                    exp: '20250117',
                    ivl: '1h',
                    start: '20240105',
                    strike: '150',
                    right: 'C'
                },
                headers: {},
                body: null
            };

            const prepared = await handler.prepareRequest(request);
            const url = new URL(prepared.url);

            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('expiration')).toBe('20250117');
            expect(url.searchParams.get('interval')).toBe('1h');
            expect(url.searchParams.get('date')).toBe('20240105');
            expect(url.searchParams.get('format')).toBe('json');

            // Check removed V2 params
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.has('exp')).toBe(false);
            expect(url.searchParams.has('ivl')).toBe(false);
            expect(url.searchParams.has('start')).toBe(false);
        });
    });

    describe('processResponse', () => {
        it('should transform V3 nested object list response to V2 row format', () => {
            const result = handler.processResponse(fixtureData.response.body, 200);

            expect(result.statusCode).toBe(200);

            const body = result.body as any;
            expect(body.header.format).toEqual(["date", "ms_of_day", "bid", "ask", "bid_size", "ask_size"]);
            expect(body.response).toBeArray();
            expect(body.response.length).toBeGreaterThan(0);

            // Verify first row
            const firstRow = body.response[0];
            // 2024-01-05T09:30:00 -> date: 20240105, ms: 34200000 (9.5 * 3600 * 1000)
            expect(firstRow[0]).toBe(20240105);
            expect(firstRow[1]).toBe(34200000);
            expect(firstRow[2]).toBeNumber(); // bid
            expect(firstRow[3]).toBeNumber(); // ask
        });

        it('should handle 472 (no data) correctly', () => {
            const result = handler.processResponse(null, 472);
            expect(result.statusCode).toBe(204);
            expect((result.body as any).response).toEqual([]);
        });
    });
});
