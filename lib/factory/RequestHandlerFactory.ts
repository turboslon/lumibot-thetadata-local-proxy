import type { RequestHandler } from '../handlers/types';

// Import all handlers
import { TerminalStatusCheckHandler } from '../handlers/terminal/TerminalStatusCheckHandler';
import { TerminalShutdownHandler } from '../handlers/terminal/TerminalShutdownHandler';
// TODO: Import other handlers as they are implemented

export class RequestHandlerFactory {
    private handlers: RequestHandler[] = [];

    constructor(baseUrl: string) {
        // Register all handlers
        this.handlers = [
            // Terminal
            new TerminalStatusCheckHandler(baseUrl),
            new TerminalShutdownHandler(baseUrl),

            // TODO: Add other handlers here
        ];
    }

    /**
     * Find the appropriate handler for a given path
     */
    getHandler(path: string): RequestHandler | null {
        // Remove leading slash for matching if needed, or rely on regex patterns in handlers
        // Handlers usually have regex that handles optional leading slash
        return this.handlers.find(h => h.canHandle(path)) || null;
    }

    /**
     * Get all registered handler IDs
     */
    getRegisteredHandlers(): string[] {
        return this.handlers.map(h => h.handlerId);
    }
}
