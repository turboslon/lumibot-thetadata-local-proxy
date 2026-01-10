import { BaseRequestHandler } from './BaseRequestHandler';
import type { HandlerRequest, PreparedRequest } from '../types';

export abstract class V3RequestHandler extends BaseRequestHandler {
    readonly apiVersion = 'v3' as const;

    /** V3 endpoint path (without /v3 prefix) */
    abstract readonly endpoint: string;

    async prepareRequest(request: HandlerRequest): Promise<PreparedRequest> {
        // Build URL with V3 prefix
        const cleanPath = this.endpoint.replace(/^\/+/, '');
        const url = new URL(`/v3/${cleanPath}`, this.baseUrl);

        // Add query params
        if (request.queryParams) {
            Object.entries(request.queryParams).forEach(([k, v]) => {
                if (Array.isArray(v)) {
                    v.forEach(subV => url.searchParams.append(k, String(subV)));
                } else if (v !== undefined && v !== null) {
                    url.searchParams.set(k, String(v));
                }
            });
        }

        return {
            url: url.toString(),
            method: request.method,
            headers: {
                'Accept': 'application/json',
                ...request.headers
            }
        };
    }
}
