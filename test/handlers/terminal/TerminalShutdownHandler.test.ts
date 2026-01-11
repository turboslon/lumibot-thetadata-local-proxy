import { describe, it, expect, beforeEach } from 'bun:test';
import { TerminalShutdownHandler } from '../../../lib/handlers/terminal/TerminalShutdownHandler';

describe('TerminalShutdownHandler', () => {
    let handler: TerminalShutdownHandler;
    const baseUrl = 'http://127.0.0.1:25503';

    beforeEach(() => {
        handler = new TerminalShutdownHandler(baseUrl);
    });

    describe('canHandle', () => {
        it('should match V3 terminal shutdown path', () => {
            expect(handler.canHandle('/v3/terminal/shutdown')).toBe(true);
        });

        it('should match V3 legacy system shutdown path', () => {
            expect(handler.canHandle('/v3/system/terminal/shutdown')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('terminal/shutdown')).toBe(true);
        });

        it('should match path with case insensitivity', () => {
            expect(handler.canHandle('/V3/TERMINAL/SHUTDOWN')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('execute', () => {
        it('should return success response without calling fetch', async () => {
            const result = await handler.execute({
                method: 'GET',
                path: '/v3/terminal/shutdown',
                queryParams: {},
                headers: {},
                body: null
            });

            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual({
                status: 'SHUTDOWN_INITIATED_MOCKED',
                message: 'Terminal shutdown request intercepted and acknowledged (no actual shutdown performed).'
            });
        });
    });

    // We don't need to test processResponse thoroughly because execute is overridden
    // but we can verify it exists and behaves safely if called directly
    describe('processResponse', () => {
        it('should return input as is', () => {
            const raw = { some: 'data' };
            const result = handler.processResponse(raw, 200);
            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual(raw);
        });
    });
});
