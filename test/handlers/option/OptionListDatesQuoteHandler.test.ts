import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionListDatesQuoteHandler } from '../../../lib/handlers/option/OptionListDatesQuoteHandler';
import fixtureData from '../../fixtures/option-list-dates-quote/captured-data.json';

describe('OptionListDatesQuoteHandler', () => {
    let handler: OptionListDatesQuoteHandler;
    const baseUrl = 'http://127.0.0.1:25510';

    beforeEach(() => {
        handler = new OptionListDatesQuoteHandler(baseUrl);
    });

    describe('canHandle', () => {
        it('should match V3 path', () => {
            expect(handler.canHandle('/v3/option/list/dates/quote')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('option/list/dates/quote')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/option/list/expirations')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL with symbol and expiration', async () => {
            const request = {
                method: 'GET',
                path: '/v3/option/list/dates/quote',
                queryParams: {
                    symbol: 'AAPL',
                    expiration: '20240419'
                },
                headers: {},
                body: null
            };

            const prepared = await handler.prepareRequest(request);
            const url = new URL(prepared.url);

            expect(url.pathname).toBe('/v3/option/list/dates/quote');
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('expiration')).toBe('20240419');
            expect(url.searchParams.get('format')).toBe('json');
        });

        it('should map V2 params (root/exp) to V3 params (symbol/expiration)', async () => {
            const request = {
                method: 'GET',
                path: '/v3/option/list/dates/quote',
                queryParams: {
                    root: 'AAPL',
                    exp: '20240419'
                },
                headers: {},
                body: null
            };

            const prepared = await handler.prepareRequest(request);
            const url = new URL(prepared.url);

            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('expiration')).toBe('20240419');
            expect(url.searchParams.has('root')).toBe(false);
            expect(url.searchParams.has('exp')).toBe(false);
        });
    });

    describe('processResponse', () => {
        it('should transform V3 object list response to V2 row format', () => {
            // Use real data from fixture
            const v3Response = fixtureData.response.body;
            const result = handler.processResponse(v3Response, 200);

            expect(result.statusCode).toBe(200);
            expect(result.body).toHaveProperty('header');
            expect(result.body.header).toEqual({ format: ['dates'] });

            // Verify structure of response rows
            const rows = (result.body as any).response;
            expect(Array.isArray(rows)).toBe(true);
            expect(rows.length).toBeGreaterThan(0);

            // Check first row format - YYYYMMDD string
            const firstRow = rows[0];
            expect(Array.isArray(firstRow)).toBe(true);
            expect(firstRow[0]).toMatch(/^\d{8}$/); // YYYYMMDD
        });

        it('should handle 472 (No Data) status', () => {
            const result = handler.processResponse(null, 472);

            expect(result.statusCode).toBe(204);
            expect(result.body).toEqual({
                header: { format: [] },
                response: []
            });
        });
    });
});
