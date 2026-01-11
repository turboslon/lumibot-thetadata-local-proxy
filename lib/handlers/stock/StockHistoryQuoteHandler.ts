import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, PreparedRequest, HandlerResponse } from '../types';

export class StockHistoryQuoteHandler extends V3RequestHandler {
    readonly handlerId = 'stock-history-quote';
    readonly endpoint = 'stock/history/quote';
    readonly pathPatterns = [
        /^\/?v3\/stock\/history\/quote$/i,
        /^stock\/history\/quote$/i
    ];

    async prepareRequest(request: HandlerRequest): Promise<PreparedRequest> {
        const prepared = await super.prepareRequest(request);
        const url = new URL(prepared.url);

        // Map 'root' -> 'symbol'
        if (url.searchParams.has('root') && !url.searchParams.has('symbol')) {
            url.searchParams.set('symbol', url.searchParams.get('root')!);
            url.searchParams.delete('root');
        }

        // Map 'ivl' -> 'interval'
        if (url.searchParams.has('ivl') && !url.searchParams.has('interval')) {
            url.searchParams.set('interval', url.searchParams.get('ivl')!);
            url.searchParams.delete('ivl');
        }

        // Map 'start' -> 'date' (V3 Quote only supports single date?)
        // If 'start' matches 'end', we can use 'date'
        const start = url.searchParams.get('start');

        if (start && !url.searchParams.has('date')) {
            // Use 'start' as 'date'
            url.searchParams.set('date', start);
            // Remove start/end to avoid confusion or errors
            url.searchParams.delete('start');
            url.searchParams.delete('end');
        }

        // Force JSON format
        url.searchParams.set('format', 'json');
        url.searchParams.delete('use_csv');

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

        // Handle columnar format (V3 default)
        if (this.isColumnarFormat(rawResponse)) {
            const converted = this.columnarToRows(rawResponse as Record<string, unknown[]>);
            return {
                statusCode: this.mapStatusCode(statusCode),
                body: converted
            };
        }

        // Handle V3 Object List format (e.g. { response: [ { k: v }, ... ] })
        if (this.isObjectListFormat(rawResponse)) {
            const converted = this.objectListToRows(rawResponse as { response: Record<string, unknown>[] });
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
        // Columnar format has column names as keys with array values
        // Also check if it looks like an error object or empty
        if ('header' in obj || 'response' in obj) return false;

        // Basic check: if it has keys and values are arrays
        const keys = Object.keys(obj);
        if (keys.length === 0) return false;

        return keys.every(k => Array.isArray(obj[k]));
    }

    private isObjectListFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Record<string, unknown>;
        if (!('response' in obj) || !Array.isArray(obj.response)) return false;
        // Check if first item is object and not array
        if (obj.response.length === 0) return true; // Empty list is valid
        const first = obj.response[0];
        return typeof first === 'object' && first !== null && !Array.isArray(first);
    }

    private objectListToRows(data: { response: Record<string, unknown>[] }): { header: { format: string[] }, response: unknown[][] } {
        const items = data.response;
        if (items.length === 0) {
            return { header: { format: [] }, response: [] };
        }

        // Extract columns from first item
        const columns = Object.keys(items[0]);

        const rows = items.map(item => {
            return columns.map(col => item[col]);
        });

        return {
            header: { format: columns },
            response: rows
        };
    }
}
