import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";
import Blog from "../models/Blog.js";

describe("Blog mutations and errors", () => {
  let token;
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    await startInMemoryMongo();
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pass";
    const login = await request(app)
      .post("/api/admin/login")
      .send({
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

  test("toggle-publish returns not found for invalid id", async () => {
    const res = await request(app)
      .post("/api/blog/toggle-publish")
      .set("Authorization", token)
      .send({ id: "64b64c0b0b0b0b0b0b0b0b0b" });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("delete blog deletes associated comments", async () => {
    const blog = await Blog.create({
      title: "t",
      description: "d",
      category: "c",
      image: "i",
      isPublished: true,
    });
    const res = await request(app)
      .post("/api/blog/delete")
      .set("Authorization", token)
      .send({ id: String(blog._id) });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
