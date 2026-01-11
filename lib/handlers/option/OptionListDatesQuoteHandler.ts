import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerResponse } from '../types';

export class OptionListDatesQuoteHandler extends V3RequestHandler {
    readonly handlerId = 'option-list-dates-quote';
    readonly endpoint = 'option/list/dates/quote';
    readonly pathPatterns = [
        /^\/v3\/option\/list\/dates\/quote$/i,
        /^option\/list\/dates\/quote$/i
    ];

    /**
     * Map V3-style params to V2 param names if needed.
     * V3 uses: symbol, expiration
     * V2 usually uses: root/symbol, exp/expiration
     */
    async prepareRequest(request: import('../types').HandlerRequest): Promise<import('../types').PreparedRequest> {
        const prepared = await super.prepareRequest(request);
        const url = new URL(prepared.url);

        // Map 'root' (V2) to 'symbol' (V3) if present
        if (request.queryParams.root && !request.queryParams.symbol) {
            url.searchParams.set('symbol', String(request.queryParams.root));
            url.searchParams.delete('root');
        }

        // Map 'exp' (V2) to 'expiration' (V3) if present
        if (request.queryParams.exp && !request.queryParams.expiration) {
            url.searchParams.set('expiration', String(request.queryParams.exp));
            url.searchParams.delete('exp');
        }

        // Ensure format is JSON
        url.searchParams.set('format', 'json');

        return {
            ...prepared,
            url: url.toString()
        };
    }

    processResponse(rawResponse: unknown, statusCode: number): HandlerResponse {
        // Handle no-data response
        if (statusCode === 472) {
            return {
                statusCode: 204,
                body: { header: { format: [] }, response: [] }
            };
        }

        // Handle V3 JSON format (list of objects)
        // Expected: { response: [{ date: '2023-08-17' }, ...] }
        if (this.isObjectListFormat(rawResponse)) {
            const data = (rawResponse as any).response as Record<string, unknown>[];
            // Extract just the dates and remove dashes to match YYYYMMDD format
            const dates = data.map(row => {
                const dateStr = String(row.date);
                return [dateStr.replace(/-/g, '')];
            });

            return {
                statusCode: this.mapStatusCode(statusCode),
                body: {
                    header: { format: ['dates'] },
                    response: dates
                }
            };
        }

        // Already in row format or unknown
        // Or if it was columnar (unlikely with format=json forced, but possible)
        if (this.isColumnarFormat(rawResponse)) {
            const converted = this.columnarToRows(rawResponse as Record<string, unknown[]>);
            return {
                statusCode: this.mapStatusCode(statusCode),
                body: converted
            };
        }

        return {
            statusCode: this.mapStatusCode(statusCode),
            body: rawResponse
        };
    }

    private isObjectListFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as any;
        return Array.isArray(obj.response) &&
            obj.response.length > 0 &&
            typeof obj.response[0] === 'object' &&
            !Array.isArray(obj.response[0]) &&
            'date' in obj.response[0];
    }

    private isColumnarFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Record<string, unknown>;
        return !('header' in obj) && !('response' in obj) &&
            Object.values(obj).every(v => Array.isArray(v));
    }
}
