
import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionListExpirationsHandler } from '../../../lib/handlers/option/OptionListExpirationsHandler';
import fixtureData from '../../fixtures/option-list-expirations/captured-data.json';

describe('OptionListExpirationsHandler', () => {
    let handler: OptionListExpirationsHandler;

    beforeEach(() => {
        handler = new OptionListExpirationsHandler('http://localhost:25503');
    });

    describe('canHandle', () => {
        it('should match V3 option list expirations path', () => {
            expect(handler.canHandle('/v3/option/list/expirations')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('option/list/expirations')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/option/list/strikes')).toBe(false);
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL with query params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/option/list/expirations',
                queryParams: { symbol: 'SPY' },
                headers: {},
                body: null
            });

            expect(prepared.url).toContain('/v3/option/list/expirations');
            expect(prepared.url).toContain('symbol=SPY');
            expect(prepared.method).toBe('GET');
        });

        it('should handle additional params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/option/list/expirations',
                queryParams: { symbol: 'IWM' },
                headers: {},
                body: null
            });
            expect(prepared.url).toContain('symbol=IWM');
        });
    });

    describe('processResponse', () => {
        it('should convert columnar format to row format', () => {
            // Using captured data for realistic test
            const capturedResponse = fixtureData.response.body as Record<string, unknown[]>;
            const statusCode = fixtureData.response.status;

            const result = handler.processResponse(capturedResponse, statusCode);

            expect(result.statusCode).toBe(200);

            // Verify structure matches V2 format
            // Row format: { "header": { "format": ["col1", ...] }, "response": [[val1, val2...], ...] }
            const body = result.body as any;
            expect(body.header).toBeDefined();
            expect(body.header.format).toBeDefined();
            expect(Array.isArray(body.header.format)).toBe(true);
            expect(body.response).toBeDefined();
            expect(Array.isArray(body.response)).toBe(true);

            // For expirations, we expect at least one column (likely "date" or "expirations")
            expect(body.header.format.length).toBeGreaterThan(0);
            if (body.response.length > 0) {
                expect(body.response[0].length).toBe(body.header.format.length);
            }
        });

        it('should handle 472 (No Data) by returning 204', () => {
            const result = handler.processResponse(null, 472);
            expect(result.statusCode).toBe(204);
            const body = result.body as any;
            expect(body.header.format).toEqual([]);
            expect(body.response).toEqual([]);
        });

        it('should pass through already formatted responses', () => {
            const rowResponse = {
                header: { format: ['expirations'] },
                response: [['20240101']]
            };

            const result = handler.processResponse(rowResponse, 200);
            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual(rowResponse);
        });
    });
});
