import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, PreparedRequest, HandlerResponse } from '../types';

export class OptionHistoryQuoteHandler extends V3RequestHandler {
    readonly handlerId = 'option-history-quote';
    readonly endpoint = 'option/history/quote';
    readonly pathPatterns = [
        /^\/v3\/option\/history\/quote$/i,
        /^option\/history\/quote$/i
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

        // Map 'start' -> 'date' (V3 Quote only supports single date)
        const start = url.searchParams.get('start');
        if (start && !url.searchParams.has('date')) {
            url.searchParams.set('date', start);
            url.searchParams.delete('start');
            url.searchParams.delete('end');
        }

        // Force JSON format
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

        // Handle nested object list format
        // { response: [ { contract: {...}, data: [ ... ] } ] }
        if (this.isNestedObjectListFormat(rawResponse)) {
            const converted = this.nestedObjectListToRows(rawResponse as any);
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

    private isNestedObjectListFormat(data: unknown): boolean {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Record<string, unknown>;
        if (!('response' in obj) || !Array.isArray(obj.response)) return false;
        if (obj.response.length === 0) return true;
        const first = obj.response[0];
        return typeof first === 'object' && first !== null && 'contract' in first && 'data' in first;
    }

    private nestedObjectListToRows(data: { response: { data: Record<string, unknown>[] }[] }): { header: { format: string[] }, response: unknown[][] } {
        // We only care about the data for the first contract in the response for now
        // or should we merge them? The queue client expects a single table.
        // Usually these requests are for a single contract.

        const format = ["date", "ms_of_day", "bid", "ask", "bid_size", "ask_size"];
        const rows: unknown[][] = [];

        if (data.response.length > 0) {
            const innerData = data.response[0].data;
            if (Array.isArray(innerData)) {
                for (const item of innerData) {
                    // Extract date and ms_of_day from timestamp
                    // Timestamp example: "2024-01-05T09:30:00"
                    const timestampStr = String(item.timestamp);
                    const dateObj = new Date(timestampStr); // This parses as UTC or local? 
                    // Wait, timestamp from ThetaData is usually exchange time (ET) or similar?
                    // "2024-01-05T09:30:00" has no timezone offset. 
                    // Let's treat it as string manipulation to be safe/consistent with expectation.

                    // expected date: YYYYMMDD
                    // expected ms_of_day: int

                    // Simple parsing:
                    const [datePart, timePart] = timestampStr.split('T');
                    const dateInt = parseInt(datePart.replace(/-/g, ''), 10);

                    // timePart: "09:30:00"
                    const [hh, mm, ss] = timePart.split(':').map(Number);
                    const msOfDay = (hh * 3600 + mm * 60 + ss) * 1000;

                    rows.push([
                        dateInt,
                        msOfDay,
                        item.bid,
                        item.ask,
                        item.bid_size,
                        item.ask_size
                    ]);
                }
            }
        }

        return {
            header: { format },
            response: rows
        };
    }
}
