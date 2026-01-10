import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { StockHistoryQuoteHandler } from '../../../lib/handlers/stock/StockHistoryQuoteHandler';
import fixtureData from '../../fixtures/stock-history-quote/captured-data.json';

// Mock fetch
const originalFetch = global.fetch;

describe('StockHistoryQuoteHandler', () => {
    let handler: StockHistoryQuoteHandler;

    beforeEach(() => {
        handler = new StockHistoryQuoteHandler('http://localhost:25510');
        global.fetch = mock();
    });

    // Restore fetch after tests
    // afterAll(() => {
    //     global.fetch = originalFetch;
    // });

    describe('canHandle', () => {
        it('should match V3 stock quote path', () => {
            expect(handler.canHandle('/v3/stock/history/quote')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('stock/history/quote')).toBe(true);
        });
    });

    describe('prepareRequest', () => {
        it('should map V2 params to V3 params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/stock/history/quote',
                queryParams: {
                    root: 'AAPL',
                    start: '20240105',
                    end: '20240105', // Should be removed/mapped
                    ivl: '1h'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);
            expect(url.pathname).toBe('/v3/stock/history/quote');
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('date')).toBe('20240105');
            expect(url.searchParams.get('interval')).toBe('1h');
            expect(url.searchParams.get('format')).toBe('json');

            // Should remove old params
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.has('start')).toBe(false);
            expect(url.searchParams.has('end')).toBe(false);
            expect(url.searchParams.has('ivl')).toBe(false);
            expect(url.searchParams.has('use_csv')).toBe(false);
        });

        it('should pass through V3 params if already correct', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/stock/history/quote',
                queryParams: {
                    symbol: 'MSFT',
                    date: '20240201',
                    interval: '5m'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);
            expect(url.searchParams.get('symbol')).toBe('MSFT');
            expect(url.searchParams.get('date')).toBe('20240201');
            expect(url.searchParams.get('interval')).toBe('5m');
            // Format should strictly be added
            expect(url.searchParams.get('format')).toBe('json');
        });
    });

    describe('execute', () => {
        it('should fetch and transform data correctly (Integration-like with fixture)', async () => {
            // Setup mock to return fixture data
            (global.fetch as any).mockResolvedValue({
                text: async () => JSON.stringify(fixtureData.response.body),
                status: 200,
                headers: new Map(),
            });

            const response = await handler.execute({
                method: 'GET',
                path: '/v3/stock/history/quote',
                queryParams: { root: 'AAPL', start: '20240105', ivl: '1h' },
                headers: {},
                body: null
            });

            expect(response.statusCode).toBe(200);

            // Check body structure (should be converted to V2 row format)
            const body = response.body as any;
            expect(body.header).toBeDefined();
            expect(body.header.format).toBeArray();
            expect(body.response).toBeArray();

            // Check content
            expect(body.header.format).toContain('bid');
            expect(body.header.format).toContain('ask');
            expect(body.response.length).toBeGreaterThan(0);

            // Verify one row
            const firstRow = body.response[0];
            expect(firstRow.length).toBe(body.header.format.length);
        });

        it('should handle 472 (No Data) by returning 204', async () => {
            (global.fetch as any).mockResolvedValue({
                text: async () => '',
                status: 472,
                headers: new Map(),
            });

            const response = await handler.execute({
                method: 'GET',
                path: '/v3/stock/history/quote',
                queryParams: { root: 'UNKNOWN' },
                headers: {},
                body: null
            });

            expect(response.statusCode).toBe(204);
            expect((response.body as any).response).toEqual([]);
        });
    });
});
