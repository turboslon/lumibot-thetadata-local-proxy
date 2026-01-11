import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionHistoryEodHandler } from '../../../lib/handlers/option/OptionHistoryEodHandler';
import fixtureData from '../../fixtures/option-history-eod/captured-data.json';

describe('OptionHistoryEodHandler', () => {
    let handler: OptionHistoryEodHandler;
    const baseUrl = 'http://127.0.0.1:25510';

    beforeEach(() => {
        handler = new OptionHistoryEodHandler(baseUrl);
    });

    describe('canHandle', () => {
        it('should match V3 option EOD path', () => {
            expect(handler.canHandle('/v3/option/history/eod')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('option/history/eod')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/option/history/ohlc')).toBe(false);
            expect(handler.canHandle('/v3/stock/history/eod')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should map query params correctly', async () => {
            const request = {
                method: 'GET',
                path: '/v3/option/history/eod',
                queryParams: {
                    root: 'AAPL',
                    exp: '20250117',
                    strike: '220',
                    right: 'C',
                    start: '20241101',
                    end: '20241110'
                },
                headers: {},
                body: null
            };

            const prepared = await handler.prepareRequest(request);
            const url = new URL(prepared.url);

            expect(url.pathname).toBe('/v3/option/history/eod');
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.get('expiration')).toBe('20250117');
            expect(url.searchParams.has('exp')).toBe(false);
            expect(url.searchParams.get('start_date')).toBe('20241101');
            expect(url.searchParams.has('start')).toBe(false);
            expect(url.searchParams.get('end_date')).toBe('20241110');
            expect(url.searchParams.has('end')).toBe(false);
            expect(url.searchParams.get('strike')).toBe('220');
            expect(url.searchParams.get('right')).toBe('C');
            expect(url.searchParams.get('format')).toBe('json');
        });
    });

    describe('processResponse', () => {
        it('should handle 472 (No Data) correctly', () => {
            const response = handler.processResponse(null, 472);
            expect(response.statusCode).toBe(204);
            expect(response.body).toEqual({
                header: { format: [] },
                response: []
            });
        });

        it('should transform nested response using fixture data', () => {
            const rawResponse = fixtureData.response.body;
            // The fixture rawResponse might be a string due to serialization in capture script
            // But usually the capture script parses it if it can. 
            // In the file read above, it was an Object.
            // Let's ensure we pass the object.

            const response = handler.processResponse(rawResponse, 200);

            expect(response.statusCode).toBe(200);
            const body = response.body as any;

            // Validate structure
            expect(body.header).toBeDefined();
            expect(body.header.format).toBeDefined();
            expect(Array.isArray(body.header.format)).toBe(true);
            expect(body.response).toBeDefined();
            expect(Array.isArray(body.response)).toBe(true);

            // Check headers contain expected columns from fixture
            expect(body.header.format).toContain('ask_size');
            expect(body.header.format).toContain('close');
            expect(body.header.format).toContain('last_trade');

            // Check response data
            expect(body.response.length).toBeGreaterThan(0);
            const firstRow = body.response[0];
            expect(firstRow.length).toBe(body.header.format.length);

            // Check value mapping with fixture data (first item)
            // Fixuture: {"ask_size":9, ... "close":12.5}
            const closeIndex = body.header.format.indexOf('close');
            expect(firstRow[closeIndex]).toBe(12.5);
        });

        it('should handle columnar format as fallback', () => {
            const columnarData = {
                date: [20240101, 20240102],
                open: [100, 101],
                close: [105, 106]
            };

            const response = handler.processResponse(columnarData, 200);
            const body = response.body as any;

            expect(body.header.format).toEqual(['date', 'open', 'close']);
            expect(body.response).toEqual([
                [20240101, 100, 105],
                [20240102, 101, 106]
            ]);
        });
    });
});
