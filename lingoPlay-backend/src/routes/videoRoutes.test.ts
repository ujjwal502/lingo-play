import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import videoRoutes from "./videoRoutes";

const app = express();
app.use(express.json());
app.use("/api/video", videoRoutes);

describe("routes/videoRoutes", () => {
  it("GET /:videoId/status returns 404 when video not found", async () => {
    const res = await request(app).get("/api/video/unknown/status");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Video not found/i);
  });

  it("POST /upload validates missing file", async () => {
    const res = await request(app).post("/api/video/upload").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
