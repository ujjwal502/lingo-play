import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiService } from "./apiService";

describe("services/apiService", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn();
  });

  it("handles JSON error responses", async () => {
    // @ts-ignore
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not found" }),
    });
    await expect(apiService.getTranscription("x")).rejects.toThrow(/Not found/);
  });

  it("navigates to timestamp via POST", async () => {
    // @ts-ignore
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, timestamp: 12.3 }),
    });
    const res = await apiService.navigateToTimestamp(12.3);
    expect(res.success).toBe(true);
  });

  it("generateVideo posts text and persona", async () => {
    // @ts-ignore
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, generationId: "g1" }),
    });
    const res = await apiService.generateVideo("hello", {
      voice: "female",
      style: "professional",
    });
    expect(res.success).toBe(true);
    expect(res.generationId).toBe("g1");
  });
});
