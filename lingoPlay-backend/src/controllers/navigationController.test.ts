import { describe, it, expect } from "vitest";
import { navigateToTimestamp } from "./navigationController";

const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: any) => {
    res.body = body;
    return res;
  };
  return res;
};

describe("controllers/navigationController", () => {
  it("navigateToTimestamp validates negative input", async () => {
    const req: any = { body: { timestamp: -3 } };
    const res = createMockRes();
    await navigateToTimestamp(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
