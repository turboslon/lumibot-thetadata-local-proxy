/**
 * Handler request/response types
 */

export interface HandlerRequest {
    method: string;
    path: string;
    queryParams: Record<string, unknown>;
    headers: Record<string, string>;
    body: string | null;
}

export interface HandlerResponse {
    statusCode: number;
    body: unknown;
    headers?: Record<string, string>;
    error?: string;
}

export interface RequestHandler {
    /** Unique identifier for this handler */
    readonly handlerId: string;

    /** Path patterns this handler responds to */
    readonly pathPatterns: RegExp[];

    /** API version: v2 or v3 */
    readonly apiVersion: 'v2' | 'v3';

    /** Check if this handler can process the given path */
    canHandle(path: string): boolean;

    /** Pre-process request before sending to ThetaData */
    prepareRequest(request: HandlerRequest): Promise<PreparedRequest>;

    /** Execute the request against ThetaData Terminal */
    execute(request: HandlerRequest): Promise<HandlerResponse>;

    /** Post-process response from ThetaData */
    processResponse(rawResponse: unknown, statusCode: number): HandlerResponse;
}

export interface PreparedRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string | Buffer;
}
