import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

import generationRoutes from "../routes/generationRoutes";

vi.mock("fluent-ffmpeg", () => ({
  default: () => {
    const chain: any = {
      input: () => chain,
      inputOptions: () => chain,
      outputOptions: () => chain,
      on: (ev: string, cb: any) => {
        if (ev === "end") chain._end = cb;
        if (ev === "error") chain._err = cb;
        return chain;
      },
      save: (_: string) => {
        // simulate async completion
        setTimeout(() => {
          if (chain._end) chain._end();
        }, 0);
      },
      _end: undefined,
      _err: undefined,
    };
    return chain;
  },
}));

vi.mock("jimp", () => ({
  Jimp: class MockJimp {
    width: number;
    height: number;
    color: number;
    constructor({ width, height, color }: any) {
      this.width = width;
      this.height = height;
      this.color = color;
    }
    static async read() {
      return new (this as any)({ width: 10, height: 10, color: 0 });
    }
    composite() {
      return this;
    }
    async getBuffer() {
      return Buffer.from("img");
    }
  },
}));

vi.mock("../services/googleCloudService", () => ({
  default: {
    generateSpeech: vi.fn().mockResolvedValue(Buffer.from("audio")),
    uploadFile: vi.fn().mockResolvedValue("https://gcs/video.mp4"),
    getSignedUrl: vi.fn().mockResolvedValue("https://signed.gcs/video.mp4"),
  },
}));

vi.mock("../services/didService", () => ({
  default: {
    createTalkWithAudio: vi.fn().mockResolvedValue({ id: "talk1" }),
    getTalk: vi.fn().mockResolvedValue({
      status: "done",
      result_url: "https://did/video.mp4",
    }),
  },
}));

vi.mock("../utils/websocket", () => ({ __esModule: true, default: vi.fn() }));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue(Buffer.from("video")),
}));

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use("/api/generation", generationRoutes);

describe("generation flow happy path", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Disable D-ID to use placeholder path for deterministic test
    delete process.env.DID_API_USERNAME;
    delete process.env.DID_API_PASSWORD;
    delete process.env.DID_AVATAR_IMAGE_URL;
    delete process.env.DID_USE_TEXT;
  });

  it("starts generation and reports completed status with URLs", async () => {
    const createRes = await request(app)
      .post("/api/generation/create")
      .send({
        text: "hello world",
        persona: { voice: "female", style: "professional" },
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);
    const id = createRes.body.generationId;
    expect(id).toBeTruthy();

    await vi.runAllTimersAsync();

    const statusRes = await request(app).get(`/api/generation/${id}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.generationId).toBe(id);

    expect(statusRes.body.videoUrl).toMatch(/^https:\/\/signed\.gcs\//);
  });
});
