import { describe, expect, test, beforeEach } from "bun:test";
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
        expect(["pending", "processing"]).toContain(item.status);

        // 2. Manually simulate completion (normally done by background process)
        // We can modify the object directly since it's in-memory and by reference, 
        // but deeper integration requires mocking the handler. 
        // For this unit test of the store logic, direct modification is fine.
        item.status = "completed";
        item.result = { success: true };
        item.resultStatusCode = 200;

        // 3. First retrieval - should return the item
        const retrieved1 = getRequest(item.requestId);
        expect(retrieved1).toBeDefined();
        expect(retrieved1?.status).toBe("completed");
        expect(retrieved1?.result).toEqual({ success: true });

        // 4. Second retrieval - should STILL return the item (this is the fix we want)
        const retrieved2 = getRequest(item.requestId);
        expect(retrieved2).toBeDefined();
        expect(retrieved2?.status).toBe("completed");
        expect(retrieved2?.result).toEqual({ success: true });
    });
});
