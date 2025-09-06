import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import generationRoutes from "./generationRoutes";

const app = express();
app.use(express.json());
app.use("/api/generation", generationRoutes);

describe("routes/generationRoutes", () => {
  it("POST /create validates missing body", async () => {
    const res = await request(app).post("/api/generation/create").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /:id/status returns 404 when not found", async () => {
    const res = await request(app).get("/api/generation/unknown/status");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
