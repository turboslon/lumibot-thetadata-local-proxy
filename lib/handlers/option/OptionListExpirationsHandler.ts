
import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerResponse } from '../types';

export class OptionListExpirationsHandler extends V3RequestHandler {
    readonly handlerId = 'option-list-expirations';
    readonly endpoint = 'option/list/expirations';
    readonly pathPatterns = [
        /^\/v3\/option\/list\/expirations$/i,
        /^option\/list\/expirations$/i
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

        // Handle V3 JSON format (list of objects)
        // Expected: { response: [{ symbol: '...', expiration: '...' }, ...] }
        if (this.isObjectListFormat(rawResponse)) {
            const data = (rawResponse as any).response as Record<string, unknown>[];
            // Extract just the expiration dates
            const expirations = data.map(row => [row.expiration]);

            return {
                statusCode: this.mapStatusCode(statusCode),
                body: {
                    header: { format: ['expirations'] },
                    response: expirations
                }
            };
        }

        // Already in row format or unknown
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
            !Array.isArray(obj.response[0]);
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
