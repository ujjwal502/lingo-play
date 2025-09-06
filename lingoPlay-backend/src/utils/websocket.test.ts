import { describe, it, expect, vi } from "vitest";
import { setWsConnections } from "./websocket";
import broadcastMessage from "./websocket";

describe("utils/websocket", () => {
  it("no-ops when no connections are set", () => {
    // Should not throw
    broadcastMessage({
      type: "error",
      data: { message: "x" },
      timestamp: new Date().toISOString(),
    } as any);
  });

  it("broadcasts to ready connections only", () => {
    const sent: string[] = [];
    const ready = { readyState: 1, send: vi.fn((p: string) => sent.push(p)) };
    const notReady = { readyState: 0, send: vi.fn() };
    const set = new Set<any>([ready, notReady]);
    setWsConnections(set);

    broadcastMessage({
      type: "error",
      data: { message: "t" },
      timestamp: new Date().toISOString(),
    } as any);

    expect(ready.send).toHaveBeenCalledTimes(1);
    expect(notReady.send).not.toHaveBeenCalled();
    expect(sent.length).toBe(1);
  });
});
