import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";
import * as ws from "./services/wsClient";

describe("App integration", () => {
  it("connects WebSocket on mount and handles completion callbacks", () => {
    const connectSpy = vi.spyOn(ws, "wsClient", "get").mockReturnValue({
      connect: vi.fn((cbs: any) => {
        // Simulate a transcription complete event immediately
        cbs?.onTranscriptionComplete?.({
          videoId: "v1",
          progress: 100,
          message: "done",
          transcription: {
            segments: [
              { text: "hello", startTime: 0, endTime: 1, confidence: 1 },
            ],
            fullText: "hello",
            summary: "sum",
          },
        });
      }),
      disconnect: vi.fn(),
    } as any);

    render(<App />);
    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });
});
