import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, HandlerResponse, PreparedRequest } from '../types';

export class TerminalStatusCheckHandler extends V3RequestHandler {
    readonly handlerId = 'terminal-status-check';
    readonly endpoint = 'terminal/mdds/status';
    readonly pathPatterns = [
        /^\/v3\/terminal\/mdds\/status$/i,
        /^terminal\/mdds\/status$/i
    ];

    async prepareRequest(request: HandlerRequest): Promise<PreparedRequest> {
        const prepared = await super.prepareRequest(request);

        // The status endpoint returns 406 if Accept: application/json is sent
        // and doesn't support format=json parameter well in some versions
        delete prepared.headers['Accept'];

        // Remove format=json from URL if present
        const url = new URL(prepared.url);
        url.searchParams.delete('format');
        prepared.url = url.toString();

        return prepared;
    }

    processResponse(rawResponse: unknown, statusCode: number): HandlerResponse {
        // Check if rawResponse is the literal string "CONNECTED"
        // The terminal returns text/plain "CONNECTED"
        const isConnected = rawResponse === 'CONNECTED';

        const body = {
            status: isConnected ? 'CONNECTED' : (rawResponse || 'UNKNOWN')
        };

        return {
            statusCode: this.mapStatusCode(statusCode),
            body
        };
    }
}
