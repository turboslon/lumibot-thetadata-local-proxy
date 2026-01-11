import type {
    HandlerRequest,
    HandlerResponse,
    PreparedRequest,
    RequestHandler
} from '../types';

export abstract class BaseRequestHandler implements RequestHandler {
    abstract readonly handlerId: string;
    abstract readonly pathPatterns: RegExp[];
    abstract readonly apiVersion: 'v2' | 'v3';

    protected readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    canHandle(path: string): boolean {
        return this.pathPatterns.some(pattern => pattern.test(path));
    }

    abstract prepareRequest(request: HandlerRequest): Promise<PreparedRequest>;

    async execute(request: HandlerRequest): Promise<HandlerResponse> {
        try {
            const prepared = await this.prepareRequest(request);

            const response = await fetch(prepared.url, {
                method: prepared.method,
                headers: prepared.headers,
                body: prepared.body as BodyInit
            });

            const rawText = await response.text();
            let rawBody: unknown;

            try {
                rawBody = JSON.parse(rawText);
            } catch {
                rawBody = rawText;
            }

            return this.processResponse(rawBody, response.status);

        } catch (error) {
            return {
                statusCode: 500,
                body: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    abstract processResponse(rawResponse: unknown, statusCode: number): HandlerResponse;

    /** Helper: Map ThetaData status codes to standard HTTP responses */
    protected mapStatusCode(thetaStatus: number): number {
        // ThetaData-specific status codes
        switch (thetaStatus) {
            case 472: return 204; // No data -> No Content
            case 571: return 503; // Server starting -> Service Unavailable
            default: return thetaStatus;
        }
    }

    /** Helper: Convert columnar response to row format */
    protected columnarToRows(columnar: Record<string, unknown[]>): {
        header: { format: string[] };
        response: unknown[][];
    } {
        const columns = Object.keys(columnar);
        if (columns.length === 0) {
            return { header: { format: [] }, response: [] };
        }

        const rowCount = (columnar[columns[0]] as unknown[]).length;
        const rows: unknown[][] = [];

        for (let i = 0; i < rowCount; i++) {
            rows.push(columns.map(col => (columnar[col] as unknown[])[i]));
        }

        return {
            header: { format: columns },
            response: rows
        };
    }
}
