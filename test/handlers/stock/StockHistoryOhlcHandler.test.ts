import { describe, it, expect, beforeEach } from 'bun:test';
import { StockHistoryOhlcHandler } from '../../../lib/handlers/stock/StockHistoryOhlcHandler';
import fixtureData from '../../fixtures/stock-history-ohlc/captured-data.json';

describe('StockHistoryOhlcHandler', () => {
    let handler: StockHistoryOhlcHandler;

    beforeEach(() => {
        handler = new StockHistoryOhlcHandler('http://localhost:25503');
    });

    describe('canHandle', () => {
        it('should match V3 stock OHLC path', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('stock/history/ohlc')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/option/history/ohlc')).toBe(false);
            expect(handler.canHandle('/v3/stock/history/quote')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL with query params and map V2 keys to V3', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/stock/history/ohlc',
                queryParams: {
                    root: 'AAPL',
                    start: '20240105',
                    end: '20240105',
                    ivl: '1h'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);
            expect(url.pathname).toBe('/v3/stock/history/ohlc');
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('start')).toBe('20240105');
            expect(url.searchParams.get('end')).toBe('20240105');
            expect(url.searchParams.get('interval')).toBe('1h');

            // Should remove mapped V2 params
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.has('ivl')).toBe(false);
        });

        it('should preserve V3 keys if already present', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/stock/history/ohlc',
                queryParams: {
                    symbol: 'MSFT',
                    start: '20240101',
                    end: '20240102',
                    interval: '1d'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);
            expect(url.searchParams.get('symbol')).toBe('MSFT');
            expect(url.searchParams.get('interval')).toBe('1d');
        });
    });

    describe('processResponse', () => {
        it('should handle missing data (472) correctly', () => {
            const response = handler.processResponse(null, 472);
            expect(response.statusCode).toBe(204);
            expect(response.body).toEqual({
                header: { format: [] },
                response: []
            });
        });

        it('should convert V3 columnar format to V2 row format', () => {
            // Using the synthesized body from fixture which is in Columnar format
            const v3Response = fixtureData.response.body;

            // Verify our fixture input is indeed columnar (keys are arrays)
            expect(Array.isArray(v3Response.date)).toBe(true);
            expect(Array.isArray(v3Response.open)).toBe(true);

            const result = handler.processResponse(v3Response, 200);

            expect(result.statusCode).toBe(200);

            const body = result.body as any;
            expect(body.header).toBeDefined();
            expect(body.response).toBeDefined();

            // Check headers
            const expectedHeaders = Object.keys(v3Response);
            expect(body.header.format).toEqual(expectedHeaders);

            // Check row count
            expect(body.response.length).toBe(3); // Based on fixture

            // Check first row data
            const firstRow = body.response[0];
            expect(firstRow[expectedHeaders.indexOf('date')]).toBe(20240105);
            expect(firstRow[expectedHeaders.indexOf('open')]).toBe(182.0);
            expect(firstRow[expectedHeaders.indexOf('volume')]).toBe(10000);
        });

        it('should valid generic JSON error response', () => {
            const errorBody = { message: "Some error" };
            const result = handler.processResponse(errorBody, 400);
            expect(result.statusCode).toBe(400);
            expect(result.body).toEqual(errorBody);
        });
    });
});
