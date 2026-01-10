import { V3RequestHandler } from '../base/V3RequestHandler';
import type { HandlerRequest, HandlerResponse } from '../types';

export class TerminalShutdownHandler extends V3RequestHandler {
    readonly handlerId = 'terminal-shutdown';
    readonly endpoint = 'terminal/shutdown'; // Primary endpoint, though we don't use it for fetch
    readonly pathPatterns = [
        /^\/v3\/terminal\/shutdown$/i,
        /^\/v3\/system\/terminal\/shutdown$/i, // Legacy fallback
        /^terminal\/shutdown$/i,
        /^system\/terminal\/shutdown$/i
    ];

    /**
     * Override execute to NOT call the terminal.
     * We just return success to satisfy the client's expectation.
     */
    async execute(_request: HandlerRequest): Promise<HandlerResponse> {
        // Return 200 OK to simulate successful shutdown initiation
        return {
            statusCode: 200,
            body: {
                status: 'SHUTDOWN_INITIATED_MOCKED',
                message: 'Terminal shutdown request intercepted and acknowledged (no actual shutdown performed).'
            }
        };
    }

    // processResponse is required by abstract base but won't be called because we override execute
    processResponse(rawResponse: unknown, statusCode: number): HandlerResponse {
        return {
            statusCode,
            body: rawResponse
        };
    }
}
