import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

import transcriptionRoutes from "../routes/transcriptionRoutes";
import { videoStore } from "./videoController";

vi.mock("../services/googleCloudService", () => ({
  default: {
    extractAudioFromVideo: vi.fn().mockResolvedValue("gs://bucket/audio.wav"),
    transcribeAudio: vi.fn().mockResolvedValue({
      results: [
        {
          alternatives: [
            {
              transcript: "Hello world",
              confidence: 0.92,
              words: [
                {
                  word: "Hello",
                  startTime: { seconds: "0", nanos: 0 },
                  endTime: { seconds: "0", nanos: 500000000 },
                },
                {
                  word: "world",
                  startTime: { seconds: "0", nanos: 600000000 },
                  endTime: { seconds: "1", nanos: 0 },
                },
              ],
            },
          ],
        },
      ],
    }),
  },
}));

vi.mock("../services/vertexAiService", () => ({
  default: {
    summarizeText: vi.fn().mockResolvedValue("Hello summary"),
  },
}));

// Avoid real websocket sends
vi.mock("../utils/websocket", () => ({
  __esModule: true,
  default: vi.fn(),
}));

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use("/api/transcription", transcriptionRoutes);

describe("transcription flow happy path", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts transcription and eventually returns stored data", async () => {
    const videoId = "vid-flow-1";
    videoStore.set(videoId, {
      videoId,
      originalName: "a.mp4",
      filename: "videos/a.mp4",
      uploadUrl: "gs://bucket/a.mp4",
      size: 100,
      mimeType: "video/mp4",
      uploadTime: new Date(),
      status: "uploaded",
      originalFile: { name: "a.mp4", mimetype: "video/mp4", size: 100 },
    });

    const res = await request(app)
      .post("/api/transcription/start")
      .send({ videoId, language: "en-US" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    await vi.runAllTimersAsync();

    const res2 = await request(app).get(`/api/transcription/${videoId}`);
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.transcription.length).toBeGreaterThan(0);
    expect(res2.body.summary).toBe("Hello summary");
  });
});
