import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

describe("Admin actions", () => {
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

  test("approve and delete comment return success", async () => {
    const blog = await Blog.create({
      title: "t",
      description: "d",
      category: "c",
      image: "i",
      isPublished: true,
    });
    const comment = await Comment.create({
      blog: blog._id,
      name: "n",
      content: "c",
    });

    const approve = await request(app)
      .post("/api/admin/approve-comment")
      .set("Authorization", token)
      .send({ id: String(comment._id) });
    expect(approve.status).toBe(200);
    expect(approve.body.success).toBe(true);

    const del = await request(app)
      .post("/api/admin/delete-comment")
      .set("Authorization", token)
      .send({ id: String(comment._id) });
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });
});
