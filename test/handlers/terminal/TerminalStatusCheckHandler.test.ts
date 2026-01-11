import { describe, it, expect, beforeEach } from 'bun:test';
import { TerminalStatusCheckHandler } from '../../../lib/handlers/terminal/TerminalStatusCheckHandler';
import fixtureData from '../../fixtures/terminal-status-check/captured-data.json';

describe('TerminalStatusCheckHandler', () => {
    let handler: TerminalStatusCheckHandler;
    const baseUrl = 'http://127.0.0.1:25503';

    beforeEach(() => {
        handler = new TerminalStatusCheckHandler(baseUrl);
    });

    describe('canHandle', () => {
        it('should match V3 terminal status path', () => {
            expect(handler.canHandle('/v3/terminal/mdds/status')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('terminal/mdds/status')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL and remove prohibited headers/params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/terminal/mdds/status',
                queryParams: { format: 'json' },
                headers: {},
                body: null
            });

            const url = new URL(prepared.url);

            // Should preserve path
            expect(url.pathname).toBe('/v3/terminal/mdds/status');

            // Should remove format param
            expect(url.searchParams.has('format')).toBe(false);

            // Should remove Accept header
            expect(prepared.headers['Accept']).toBeUndefined();
        });
    });

    describe('processResponse', () => {
        it('should correctly parse the captured response', () => {
            // Use the raw text from fixture as body because captured data body might be just the string
            const rawResponse = fixtureData.response.rawText;
            const status = fixtureData.response.status;

            const result = handler.processResponse(rawResponse, status);

            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual({ status: 'CONNECTED' });
        });

        it('should handle non-connected status', () => {
            const result = handler.processResponse('SOMETHING_ELSE', 200);
            expect(result.body).toEqual({ status: 'SOMETHING_ELSE' });
        });
    });
});
