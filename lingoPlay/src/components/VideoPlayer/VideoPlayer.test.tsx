import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VideoPlayer } from "./VideoPlayer";
import * as api from "../../services/apiService";

describe("components/VideoPlayer", () => {
  it("renders upload area initially", () => {
    render(<VideoPlayer />);
    expect(screen.getByText(/Click to upload video/i)).toBeInTheDocument();
  });

  it("renders core UI and does not crash without video", () => {
    const onTimeUpdate = vi.fn();
    render(<VideoPlayer onTimeUpdate={onTimeUpdate} />);
    expect(screen.getByText("Video Player")).toBeInTheDocument();

    expect(onTimeUpdate).not.toHaveBeenCalled();
  });

  it("uploads a video and shows uploaded info", async () => {
    const uploadSpy = vi
      .spyOn(api, "apiService", "get")
      // @ts-ignore
      .mockReturnValue({
        uploadVideo: vi.fn().mockResolvedValue({
          success: true,
          videoId: "vid-1",
          filename: "a.mp4",
          uploadUrl: "http://example.com/a.mp4",
          message: "ok",
        }),
      });
    // @ts-ignore
    global.URL.createObjectURL = vi.fn(() => "blob:local");

    render(<VideoPlayer />);
    const fileInput = document.getElementById(
      "video-upload"
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "a.mp4", {
      type: "video/mp4",
    });
    // Fire change
    // @ts-ignore
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() =>
      expect(screen.getByText(/Video ID: vid-1/i)).toBeInTheDocument()
    );

    uploadSpy.mockRestore();
  });

  it("handles play/pause and time updates after upload", async () => {
    vi.spyOn(api, "apiService", "get").mockReturnValue({
      uploadVideo: vi.fn().mockResolvedValue({
        success: true,
        videoId: "vid-2",
        filename: "b.mp4",
        uploadUrl: "http://example.com/b.mp4",
        message: "ok",
      }),
    } as any);
    // @ts-ignore
    global.URL.createObjectURL = vi.fn(() => "blob:local");

    const onTimeUpdate = vi.fn();
    render(<VideoPlayer onTimeUpdate={onTimeUpdate} />);
    const fileInput = document.getElementById(
      "video-upload"
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "b.mp4", {
      type: "video/mp4",
    });
    // @ts-ignore
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    let videoEl!: HTMLVideoElement;
    await waitFor(() => {
      const el = document.querySelector("video") as HTMLVideoElement | null;
      if (!el) throw new Error("not ready");
      videoEl = el;
    });
    // Mock play/pause
    // @ts-ignore
    videoEl.play = vi.fn();
    // @ts-ignore
    videoEl.pause = vi.fn();

    // Click play
    fireEvent.click(screen.getByRole("button", { name: /Play/i }));
    // Click pause
    fireEvent.click(screen.getByRole("button", { name: /Pause/i }));

    // Time update
    videoEl.currentTime = 5;
    fireEvent.timeUpdate(videoEl);
    expect(onTimeUpdate).toHaveBeenCalledWith(5);
  });
});
