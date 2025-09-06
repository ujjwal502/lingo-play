import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import transcriptionRoutes from "./transcriptionRoutes";
import { transcriptionStore } from "../controllers/transcriptionController";

const app = express();
app.use(express.json());
app.use("/api/transcription", transcriptionRoutes);

describe("routes/transcriptionRoutes", () => {
  it("POST /start validates missing videoId", async () => {
    const res = await request(app).post("/api/transcription/start").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /:videoId returns 404 when transcription not found", async () => {
    const res = await request(app).get("/api/transcription/unknown");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /:videoId returns data when present", async () => {
    const videoId = "vid-xyz";
    transcriptionStore.set(videoId, {
      videoId,
      segments: [{ text: "hello", startTime: 0, endTime: 1, confidence: 1 }],
      fullText: "hello",
      summary: "hello",
      language: "en-US",
      createdAt: new Date(),
    });
    const res = await request(app).get(`/api/transcription/${videoId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.videoId).toBe(videoId);
  });
});
