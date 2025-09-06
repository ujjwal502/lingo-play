import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./server";

describe("server", () => {
  it("GET /api/health returns OK", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(typeof res.body.timestamp).toBe("string");
  });
});
