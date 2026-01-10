import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, PreparedRequest, HandlerResponse } from '../types';

export class StockHistoryEodHandler extends V3RequestHandler {
    readonly handlerId = 'stock-history-eod';
    readonly endpoint = 'stock/history/eod';
    readonly pathPatterns = [
        /^\/v3\/stock\/history\/eod$/i,
        /^stock\/history\/eod$/i
    ];

    async prepareRequest(request: HandlerRequest): Promise<PreparedRequest> {
        const prepared = await super.prepareRequest(request);
        const url = new URL(prepared.url);

        // Map 'root' -> 'symbol'
        if (url.searchParams.has('root') && !url.searchParams.has('symbol')) {
            url.searchParams.set('symbol', url.searchParams.get('root')!);
            url.searchParams.delete('root');
        }

        // Map 'start' -> 'start_date'
        if (url.searchParams.has('start') && !url.searchParams.has('start_date')) {
            url.searchParams.set('start_date', url.searchParams.get('start')!);
            url.searchParams.delete('start');
        }

        // Map 'end' -> 'end_date'
        if (url.searchParams.has('end') && !url.searchParams.has('end_date')) {
            url.searchParams.set('end_date', url.searchParams.get('end')!);
            url.searchParams.delete('end');
        }

        // Enforce JSON format
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

        // Handle object list format (specific to EOD V3)
        // Expected: { response: [ { key: val, ... }, ... ] }
        if (this.isObjectListFormat(rawResponse)) {
            const converted = this.objectListToRows(rawResponse as { response: Record<string, unknown>[] });
            return {
                statusCode: this.mapStatusCode(statusCode),
                body: converted
            };
        }

        // Fallback or already in row format
        return {
            statusCode: this.mapStatusCode(statusCode),
            body: rawResponse
        };
    }

    private isObjectListFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as { response?: unknown };
        return Array.isArray(obj.response) &&
            obj.response.length > 0 &&
            typeof obj.response[0] === 'object' &&
            !Array.isArray(obj.response[0]);
    }

    private objectListToRows(data: { response: Record<string, unknown>[] }): {
        header: { format: string[] };
        response: unknown[][];
    } {
        const items = data.response;
        if (items.length === 0) {
            return { header: { format: [] }, response: [] };
        }

        // Extract columns from first item
        const columns = Object.keys(items[0]);

        // Map all items to rows
        const rows = items.map(item => columns.map(col => item[col]));

        return {
            header: { format: columns },
            response: rows
        };
    }
}
