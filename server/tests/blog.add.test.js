import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";

describe("Add blog validations", () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pass";
    await startInMemoryMongo();
    const login = await request(app).post("/api/admin/login").send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    token = login.body.token;
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  afterEach(async () => {
    await clearCollections();
  });

  test("POST /api/blog/add returns failure when required fields missing", async () => {
    const res = await request(app)
      .post("/api/blog/add")
      .set("Authorization", token)
      .field("blog", JSON.stringify({ title: "t" }));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe("string");
  });
});
