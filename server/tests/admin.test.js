import request from "supertest";
import app from "../server.js";
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearCollections,
} from "./setup.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

function authHeader() {
  return {
    Authorization: `Bearer ${Buffer.from(
      `${process.env.ADMIN_EMAIL || "a"}:${process.env.ADMIN_PASSWORD || "b"}`
    ).toString("base64")}`,
  };
}

describe("Admin routes", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com";
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pass";
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  afterEach(async () => {
    await clearCollections();
  });

  test("POST /api/admin/login returns token", async () => {
    const res = await request(app).post("/api/admin/login").send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
  });

  test("GET /api/admin/dashboard returns counts and recent blogs", async () => {
    await Blog.insertMany([
      {
        title: "t1",
        description: "d",
        category: "c",
        image: "i",
        isPublished: true,
      },
      {
        title: "t2",
        description: "d",
        category: "c",
        image: "i",
        isPublished: false,
      },
    ]);
    await Comment.insertMany([
      { blog: (await Blog.findOne())._id, name: "n", content: "c" },
    ]);

    // Login to get token
    const login = await request(app).post("/api/admin/login").send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    const token = login.body.token;

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dashboardData.blogs).toBeGreaterThanOrEqual(2);
    expect(res.body.dashboardData.comments).toBeGreaterThanOrEqual(1);
    expect(res.body.dashboardData.drafts).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.dashboardData.recentBlogs)).toBe(true);
  });
});
