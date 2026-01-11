import { describe, expect, test, beforeEach, mock } from "bun:test";
import { submitRequest, getRequest, getStats } from "../../lib/queueStore";

describe("QueueStore", () => {
    test("completed requests should persist after retrieval", async () => {
        // 1. Submit a request
        const payload = {
            method: "GET",
            path: "/test/path?foo=bar",
            headers: { "x-test": "true" },
        };
        const item = submitRequest(payload);
        expect(item).toBeDefined();
        // Note: The background processor runs asynchronously and may quickly change status
        // from "pending" to "failed" (since /test/path has no handler), so we just check
        // that the item was created with a valid starting status
        expect(["pending", "processing", "failed"]).toContain(item.status);

        // 2. Manually set to completed to test persistence behavior
        // This simulates what happens when a real request completes successfully
        item.status = "completed";
        item.result = { success: true };
        item.resultStatusCode = 200;

        // 3. First retrieval - should return the item
        const retrieved1 = getRequest(item.requestId);
        expect(retrieved1).toBeDefined();
        expect(retrieved1?.status).toBe("completed");
        expect(retrieved1?.result).toEqual({ success: true });

        // 4. Second retrieval - should STILL return the item (persistence test)
        const retrieved2 = getRequest(item.requestId);
        expect(retrieved2).toBeDefined();
        expect(retrieved2?.status).toBe("completed");
        expect(retrieved2?.result).toEqual({ success: true });
    });
    test("requests with query params in path should use handler", async () => {
        // Mock fetch to verify URL and return dummy response
        const originalFetch = global.fetch;
        let fetchedUrl = "";
        global.fetch = mock(async (url) => {
            fetchedUrl = url.toString();
            return new Response(JSON.stringify({ response: [] }), { status: 200 });
        }) as any;

        try {
            // 1. Submit a request with a path that matches a handler BUT has query params
            // StockHistoryEodHandler handles /v3/stock/history/eod
            const payload = {
                method: "GET",
                path: "/v3/stock/history/eod?foo=bar", // Dirty path
                headers: {},
            };

            const item = submitRequest(payload);

            // Wait for processing (processQueueLoop runs in background but we need to wait a bit)
            // sleep is not exported but we can wait for status change
            let retries = 10;
            while (item.status === 'pending' || item.status === 'processing') {
                await new Promise(r => setTimeout(r, 50));
                retries--;
                if (retries === 0) break;
            }

            // 2. Verify handler was used
            // If handler was used, it constructs URL from its endpoint: .../v3/stock/history/eod
            // If proxy was used, it uses item.path: .../v3/stock/history/eod?foo=bar

            // Note: Handler adds query params from item.queryParams, but here we didn't pass any in payload.queryParams
            // However, the handler might add default params (like format=json). 
            // StockHistoryEodHandler adds format=json.

            expect(fetchedUrl).toContain("/v3/stock/history/eod");
            expect(fetchedUrl).not.toContain("?foo=bar");
            // The dirty part "?foo=bar" should be stripped during matching AND not used by handler construction.
            // (Unless handler parses it from path? No, handler uses item.queryParams)

        } finally {
            global.fetch = originalFetch;
        }
    });
});
