import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, PreparedRequest, HandlerResponse } from '../types';

export class StockHistoryOhlcHandler extends V3RequestHandler {
    readonly handlerId = 'stock-history-ohlc';
    readonly endpoint = 'stock/history/ohlc';
    readonly pathPatterns = [
        /^\/v3\/stock\/history\/ohlc$/i,
        /^stock\/history\/ohlc$/i
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
}
