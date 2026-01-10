import { describe, it, expect, beforeEach } from 'bun:test';
import { OptionListStrikesHandler } from '../../../lib/handlers/option/OptionListStrikesHandler';

// Mock data based on documentation/expected behavior
const MOCK_RESPONSE = {
    header: {
        format: ["strikes"]
    },
    response: [
        [150.0],
        [155.0],
        [160.0]
    ]
};

// V3 Columnar format
const MOCK_COLUMNAR_RESPONSE = {
    strikes: [150.0, 155.0, 160.0]
};

describe('OptionListStrikesHandler', () => {
    let handler: OptionListStrikesHandler;

    beforeEach(() => {
        handler = new OptionListStrikesHandler('http://localhost:25510');
    });

    describe('canHandle', () => {
        it('should match V3 option strikes path', () => {
            expect(handler.canHandle('/v3/option/list/strikes')).toBe(true);
        });

        it('should match path without version prefix', () => {
            expect(handler.canHandle('option/list/strikes')).toBe(true);
        });

        it('should not match other paths', () => {
            expect(handler.canHandle('/v3/stock/history/ohlc')).toBe(false);
        });
    });

    describe('prepareRequest', () => {
        it('should build correct URL with query params', async () => {
            const prepared = await handler.prepareRequest({
                method: 'GET',
                path: '/v3/option/list/strikes',
                queryParams: { symbol: 'AAPL', exp: '20250221', format: 'json' },
                headers: {},
                body: null
            });

            expect(prepared.url).toContain('/v3/option/list/strikes');
            expect(prepared.url).toContain('symbol=AAPL');
            expect(prepared.url).toContain('exp=20250221');
            expect(prepared.url).toContain('format=json');
        });
    });

    describe('processResponse', () => {
        it('should handle columnar format and convert to row format', () => {
            const result = handler.processResponse(MOCK_COLUMNAR_RESPONSE, 200);

            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual({
                header: { format: ["strikes"] },
                response: [
                    [150.0],
                    [155.0],
                    [160.0]
                ]
            });
        });

        it('should handle native row format', () => {
            const result = handler.processResponse(MOCK_RESPONSE, 200);

            expect(result.statusCode).toBe(200);
            expect(result.body).toEqual(MOCK_RESPONSE);
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
