import { describe, it, expect, vi, beforeEach } from "vitest";
import { wsClient } from "./wsClient";

class MockWS {
  url: string;
  onopen: any;
  onmessage: any;
  onclose: any;
  onerror: any;
  constructor(url: string) {
    this.url = url;
  }
  close() {
    this.onclose && this.onclose();
  }
  send(_p: string) {}
}

describe("services/wsClient", () => {
  beforeEach(() => {
    // @ts-ignore override global WebSocket
    global.WebSocket = MockWS as any;
  });

  it("dispatches callbacks for each message type", () => {
    const callbacks = {
      onTranscriptionProgress: vi.fn(),
      onTranscriptionComplete: vi.fn(),
      onGenerationProgress: vi.fn(),
      onGenerationComplete: vi.fn(),
      onError: vi.fn(),
    };
    wsClient.connect(callbacks);
    // @ts-ignore access internal
    const ws: any = (wsClient as any).ws;
    const mk = (type: string) => ({
      type,
      data: {},
      timestamp: new Date().toISOString(),
    });
    ws.onmessage({ data: JSON.stringify(mk("transcription_progress")) });
    ws.onmessage({ data: JSON.stringify(mk("transcription_complete")) });
    ws.onmessage({ data: JSON.stringify(mk("generation_progress")) });
    ws.onmessage({ data: JSON.stringify(mk("generation_complete")) });
    ws.onmessage({ data: JSON.stringify(mk("error")) });
    expect(callbacks.onTranscriptionProgress).toHaveBeenCalled();
    expect(callbacks.onTranscriptionComplete).toHaveBeenCalled();
    expect(callbacks.onGenerationProgress).toHaveBeenCalled();
    expect(callbacks.onGenerationComplete).toHaveBeenCalled();
    expect(callbacks.onError).toHaveBeenCalled();
    wsClient.disconnect();
  });
});
