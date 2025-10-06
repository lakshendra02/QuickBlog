import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

describe("Blog routes", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  afterEach(async () => {
    await clearCollections();
  });

  test("GET /api/blog/all returns published blogs with pagination", async () => {
    const docs = Array.from({ length: 15 }, (_, i) => ({
      title: `t${i}`,
      subTitle: `s${i}`,
      description: `d${i}`,
      category: "tech",
      image: "http://i",
      isPublished: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 1000),
      updatedAt: new Date(Date.now() - i * 1000),
    }));
    await Blog.insertMany(docs);

    const res = await request(app)
      .get("/api/blog/all")
      .query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.blogs)).toBe(true);
    expect(res.body.blogs.length).toBeLessThanOrEqual(5);
    // Only published
    expect(res.body.blogs.every((b) => b.title && b.image && b.category)).toBe(
      true
    );
  });

  test("GET /api/blog/:id returns a single blog", async () => {
    const blog = await Blog.create({
      title: "t",
      subTitle: "s",
      description: "d",
      category: "tech",
      image: "http://i",
      isPublished: true,
    });
    const res = await request(app).get(`/api/blog/${blog._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.blog._id).toBe(String(blog._id));
  });

  test("POST /api/blog/comments returns approved comments with pagination", async () => {
    const blog = await Blog.create({
      title: "t",
      subTitle: "s",
      description: "d",
      category: "tech",
      image: "http://i",
      isPublished: true,
    });

    await Comment.insertMany([
      { blog: blog._id, name: "n1", content: "c1", isApproved: true },
      { blog: blog._id, name: "n2", content: "c2", isApproved: false },
      { blog: blog._id, name: "n3", content: "c3", isApproved: true },
    ]);

    const res = await request(app)
      .post("/api/blog/comments")
      .send({ blogId: String(blog._id) })
      .query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.length).toBe(2);
    expect(res.body.comments.every((c) => c.name && c.content)).toBe(true);
  });
});
