import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionHistoryOhlcHandler } from '../../../lib/handlers/option/OptionHistoryOhlcHandler';
import fixtureData from '../../fixtures/option-history-ohlc/captured-data.json';

describe('OptionHistoryOhlcHandler', () => {
    let handler: OptionHistoryOhlcHandler;

    beforeEach(() => {
        handler = new OptionHistoryOhlcHandler('http://localhost:25510');
    });

    describe('canHandle', () => {
        it('should match V3 option OHLC path', () => {
            expect(handler.canHandle('/v3/option/history/ohlc')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('option/history/ohlc')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL with query params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/option/history/ohlc',
                queryParams: {
                    root: 'AAPL',
                    exp: '20250117',
                    strike: '150000',
                    right: 'C',
                    start: '20240101',
                    end: '20240105',
                    ivl: '1h'
                },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);
            expect(url.pathname).toBe('/v3/option/history/ohlc');
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('expiration')).toBe('20250117');
            expect(url.searchParams.get('interval')).toBe('1h');
            expect(url.searchParams.get('date')).toBe('20240101');

            // Verify removal of mapped params
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.has('exp')).toBe(false);
            expect(url.searchParams.has('ivl')).toBe(false);
            expect(url.searchParams.has('start')).toBe(false);
            expect(url.searchParams.has('end')).toBe(false);
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

        it('should convert V3 nested format (from capture) to V2 row format', () => {
            // Use real captured V3 response from fixture
            const v3NestedResponse = fixtureData.response.body;

            const result = handler.processResponse(v3NestedResponse, 200);

            expect(result.statusCode).toBe(200);

            const body = result.body as any;

            // Should be converted to V2 row format
            expect(body.header).toBeDefined();
            expect(body.response).toBeInstanceOf(Array);
            expect(body.response.length).toBeGreaterThan(0);

            // Verify columns
            const headers = body.header.format;
            expect(headers).toContain('volume');
            expect(headers).toContain('open');
            expect(headers).toContain('timestamp');

            // Verify first row is an array, not an object
            expect(Array.isArray(body.response[0])).toBe(true);

            // Check specific values from fixture to ensure correct mapping
            // Fixture first item: {"volume":103,"high":0.03,...,"timestamp":"2024-12-24T09:30:00"}
            const firstRow = body.response[0];

            const volIndex = headers.indexOf('volume');
            expect(firstRow[volIndex]).toBe(103);

            const highIndex = headers.indexOf('high');
            expect(firstRow[highIndex]).toBe(0.03);
        });

        it('should pass through already formatted V2 response', () => {
            const v2Response = {
                header: { format: ["col1"] },
                response: [[1]]
            };
            const result = handler.processResponse(v2Response, 200);
            expect(result.body).toEqual(v2Response);
        });
    });
});
