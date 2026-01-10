import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerResponse } from '../types';

export class OptionListStrikesHandler extends V3RequestHandler {
    readonly handlerId = 'option-list-strikes';
    readonly endpoint = 'option/list/strikes';
    readonly pathPatterns = [
        /^\/v3\/option\/list\/strikes$/i,
        /^option\/list\/strikes$/i
    ];

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

        // Already in row format
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
        return !('header' in obj) && !('response' in obj) &&
            Object.values(obj).every(v => Array.isArray(v));
    }
}
