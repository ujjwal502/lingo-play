import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import navigationRoutes from "../routes/navigationRoutes";
import { transcriptionStore } from "./transcriptionController";

const app = express();
app.use(express.json());
app.use("/api/navigation", navigationRoutes);

describe("navigation substring fallback", () => {
  it("falls back to substring within segment when no word timings", async () => {
    const videoId = "vid-sub-1";
    transcriptionStore.set(videoId, {
      videoId,
      segments: [
        {
          text: "React development is fun",
          startTime: 10,
          endTime: 20,
          confidence: 0.9,
        },
      ],
      fullText: "React development is fun",
      summary: "",
      language: "en-US",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/navigation/phrase")
      .send({ videoId, phrase: "development" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.timestamp).toBeGreaterThanOrEqual(10);
    expect(res.body.timestamp).toBeLessThanOrEqual(20);
  });
});
