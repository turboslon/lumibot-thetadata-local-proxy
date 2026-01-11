
import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, PreparedRequest, HandlerResponse } from '../types';

export class OptionHistoryOhlcHandler extends V3RequestHandler {
    readonly handlerId = 'option-history-ohlc';
    readonly endpoint = 'option/history/ohlc';
    readonly pathPatterns = [
        /^\/v3\/option\/history\/ohlc$/i,
        /^option\/history\/ohlc$/i
    ];

    async prepareRequest(request: HandlerRequest): Promise<PreparedRequest> {
        const prepared = await super.prepareRequest(request);
        const url = new URL(prepared.url);

        // Map 'root' -> 'symbol'
        if (url.searchParams.has('root') && !url.searchParams.has('symbol')) {
            url.searchParams.set('symbol', url.searchParams.get('root')!);
            url.searchParams.delete('root');
        }

        // Map 'exp' -> 'expiration'
        if (url.searchParams.has('exp') && !url.searchParams.has('expiration')) {
            url.searchParams.set('expiration', url.searchParams.get('exp')!);
            url.searchParams.delete('exp');
        }

        // Map 'ivl' -> 'interval'
        if (url.searchParams.has('ivl') && !url.searchParams.has('interval')) {
            url.searchParams.set('interval', url.searchParams.get('ivl')!);
            url.searchParams.delete('ivl');
        }

        // Map 'start' -> 'date' (V3 Option OHLC requires 'date')
        if (url.searchParams.has('start') && !url.searchParams.has('date')) {
            url.searchParams.set('date', url.searchParams.get('start')!);
            // We keep 'start' removed? Or V3 complains about unknown params?
            // V3 usually ignores unknown params, but clean up is safer.
            url.searchParams.delete('start');
        }

        // Remove 'end' as it's not supported/used if 'date' is used
        if (url.searchParams.has('end')) {
            url.searchParams.delete('end');
        }

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

        // Handle columnar format (V3 default for some endpoints)
        if (this.isColumnarFormat(rawResponse)) {
            const converted = this.columnarToRows(rawResponse as Record<string, unknown[]>);
            return {
                statusCode: this.mapStatusCode(statusCode),
                body: converted
            };
        }

        // Handle nested format (V3 Option History OHLC default)
        // { "response": [ { "contract": ..., "data": [ { ... } ] } ] }
        if (this.isNestedFormat(rawResponse)) {
            const converted = this.nestedToRows(rawResponse as any);
            return {
                statusCode: this.mapStatusCode(statusCode),
                body: converted
            };
        }

        // Already in row format or error
        return {
            statusCode: this.mapStatusCode(statusCode),
            body: rawResponse
        };
    }

    private isColumnarFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Record<string, unknown>;

        // Row format has 'header' and 'response' keys
        if ('header' in obj || 'response' in obj) return false;

        // Check if it has keys and all values are arrays
        const keys = Object.keys(obj);
        if (keys.length === 0) return false;

        return keys.every(k => Array.isArray(obj[k]));
    }

    private isNestedFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as any;

        // Must have 'response' array
        if (!Array.isArray(obj.response) || obj.response.length === 0) return false;

        // First item must have 'data' array
        const firstItem = obj.response[0];
        return firstItem && Array.isArray(firstItem.data);
    }

    private nestedToRows(data: { response: { data: Record<string, unknown>[] }[] }): Record<string, unknown> {
        // We aggregate data from all response items (though typically there's only one contract per request)
        // We assume uniform structure in 'data' array.

        const allRows: unknown[][] = [];
        let headers: string[] = [];

        for (const item of data.response) {
            if (!item.data || item.data.length === 0) continue;

            // Determine headers from the first data item if not set
            if (headers.length === 0) {
                headers = Object.keys(item.data[0]);
            }

            // Convert each object to row
            for (const rowObj of item.data) {
                const row = headers.map(h => rowObj[h]);
                allRows.push(row);
            }
        }

        return {
            header: {
                format: headers
            },
            response: allRows
        };
    }
}
