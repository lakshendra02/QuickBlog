import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

describe("Admin additional routes", () => {
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pass";
    await startInMemoryMongo();
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

  test("Admin blogs and comments endpoints respond with success", async () => {
    const b1 = await Blog.create({
      title: "t1",
      description: "d",
      category: "c",
      image: "i",
      isPublished: true,
    });
    await Comment.create({ blog: b1._id, name: "n", content: "c" });

    const blogsRes = await request(app)
      .get("/api/admin/blogs")
      .set("Authorization", token);
    expect(blogsRes.status).toBe(200);
    expect(blogsRes.body.success).toBe(true);
    expect(Array.isArray(blogsRes.body.blogs)).toBe(true);

    const commentsRes = await request(app)
      .get("/api/admin/comments")
      .set("Authorization", token);
    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.success).toBe(true);
    expect(Array.isArray(commentsRes.body.comments)).toBe(true);
  });

  test("Admin login fails with wrong credentials", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ email: "wrong@example.com", password: "nope" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
