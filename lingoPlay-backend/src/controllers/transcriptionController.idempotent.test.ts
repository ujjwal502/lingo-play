import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

import transcriptionRoutes from "../routes/transcriptionRoutes";
import { videoStore } from "./videoController";
import { transcriptionStore } from "./transcriptionController";

vi.mock("../services/googleCloudService", () => ({
  default: {
    extractAudioFromVideo: vi.fn().mockResolvedValue("gs://bucket/audio.wav"),
    transcribeAudio: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock("../services/vertexAiService", () => ({
  default: { summarizeText: vi.fn().mockResolvedValue("") },
}));

vi.mock("../utils/websocket", () => ({ __esModule: true, default: vi.fn() }));

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use("/api/transcription", transcriptionRoutes);

describe("transcription start idempotency", () => {
  beforeEach(() => {
    transcriptionStore.clear();
  });

  it("returns existing transcription when started twice", async () => {
    const videoId = "vid-ido-1";
    videoStore.set(videoId, {
      videoId,
      originalName: "a.mp4",
      filename: "videos/a.mp4",
      uploadUrl: "gs://bucket/a.mp4",
      size: 10,
      mimeType: "video/mp4",
      uploadTime: new Date(),
      status: "uploaded",
      originalFile: { name: "a.mp4", size: 10, mimetype: "video/mp4" },
    });

    const first = await request(app)
      .post("/api/transcription/start")
      .send({ videoId });
    expect(first.status).toBe(200);

    // Seed an existing result
    transcriptionStore.set(videoId, {
      videoId,
      segments: [],
      fullText: "",
      summary: "",
      language: "en-US",
      createdAt: new Date(),
    });

    const second = await request(app)
      .post("/api/transcription/start")
      .send({ videoId });
    expect(second.status).toBe(200);
    expect(second.body.message).toMatch(/already exists/i);
  });
});
