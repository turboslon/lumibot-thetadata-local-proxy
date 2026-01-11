import { describe, it, expect, beforeEach } from 'bun:test';
import { StockHistoryEodHandler } from '../../../lib/handlers/stock/StockHistoryEodHandler';
import fixtureData from '../../fixtures/stock-history-eod/captured-data.json';

describe('StockHistoryEodHandler', () => {
    let handler: StockHistoryEodHandler;

    beforeEach(() => {
        handler = new StockHistoryEodHandler('http://localhost:25510');
    });

    describe('canHandle', () => {
        it('should match V3 stock EOD path', () => {
            expect(handler.canHandle('/v3/stock/history/eod')).toBe(true);
        });

        it('should match V3 path without leading slash', () => {
            expect(handler.canHandle('v3/stock/history/eod')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('stock/history/eod')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL and map parameters', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/stock/history/eod',
                queryParams: {
                    root: 'AAPL',
                    start: '20240101',
                    end: '20240110',
                    adjust: 'splits',
                    include_nbbo: 'true'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);

            // Check parameter mapping
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.has('root')).toBe(false);

            expect(url.searchParams.get('start_date')).toBe('20240101');
            expect(url.searchParams.has('start')).toBe(false);

            expect(url.searchParams.get('end_date')).toBe('20240110');
            expect(url.searchParams.has('end')).toBe(false);

            // Check enforced parameters
            expect(url.searchParams.get('format')).toBe('json');

            // Check passthrough parameters
            expect(url.searchParams.get('adjust')).toBe('splits');
            expect(url.searchParams.get('include_nbbo')).toBe('true');
        });
    });

    describe('processResponse', () => {
        it('should transform object list to row format', () => {
            // Use fixture response body which is the object list
            const result = handler.processResponse(fixtureData.response.body, 200);

            expect(result.statusCode).toBe(200);

            // Verify structure
            const body = result.body as any;
            expect(body.header).toBeDefined();
            expect(body.response).toBeDefined();

            // Verify header
            expect(body.header.format).toBeArray();
            expect(body.header.format.length).toBeGreaterThan(0);

            // Verify data rows
            expect(body.response).toBeArray();
            expect(body.response.length).toBeGreaterThan(0);
            expect(body.response.length).toBe(fixtureData.response.body.response.length);

            // Verify first row matches first object values
            const firstRow = body.response[0];
            const firstObj = fixtureData.response.body.response[0] as Record<string, any>;

            expect(firstRow).toBeArray();
            expect(firstRow.length).toBe(body.header.format.length);

            // Check a specific value (e.g. open price)
            const openIdx = body.header.format.indexOf('open');
            expect(openIdx).toBeGreaterThan(-1);
            expect(firstRow[openIdx]).toBe(firstObj['open']);
        });

        it('should handle 472 (No Data) status', () => {
            const result = handler.processResponse(null, 472);

            expect(result.statusCode).toBe(204);
            expect(result.body).toEqual({
                header: { format: [] },
                response: []
            });
        });

        it('should return raw response if not in object list format', () => {
            // If response is already row format or something else
            const raw = { foo: 'bar' };
            const result = handler.processResponse(raw, 200);

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe(raw);
        });
    });
});
