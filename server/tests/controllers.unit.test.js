import { jest } from "@jest/globals";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";

// Helper to create mock req/res
function createReqRes({
  body = {},
  params = {},
  query = {},
  headers = {},
} = {}) {
  const req = { body, params, query, headers };
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };
  return { req, res };
}

describe("Controller unit tests", () => {
  let blogController;
  let adminController;
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    jest.unstable_mockModule("../configs/imagekit.js", () => ({
      default: {
        upload: jest.fn().mockResolvedValue({ filePath: "/p" }),
        url: jest.fn().mockReturnValue("http://img"),
      },
    }));
    jest.unstable_mockModule("../configs/gemini.js", () => ({
      default: jest.fn().mockResolvedValue("hello world"),
    }));

    blogController = await import("../controllers/blogController.js");
    adminController = await import("../controllers/adminController.js");
  });

  test("getAllBlogs returns lean projected list", async () => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      select: () => chain,
      lean: async () => [{ _id: "1" }],
    };
    jest.spyOn(Blog, "find").mockReturnValue(chain);
    const { req, res } = createReqRes({ query: { page: "1", limit: "2" } });
    await blogController.getAllBlogs(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonPayload.success).toBe(true);
    expect(Array.isArray(res.jsonPayload.blogs)).toBe(true);
  });

  test("getAllBlogs returns error on exception", async () => {
    jest.spyOn(Blog, "find").mockImplementation(() => {
      throw new Error("boom");
    });
    const { req, res } = createReqRes();
    await blogController.getAllBlogs(req, res);
    expect(res.jsonPayload.success).toBe(false);
  });

  test("getBlogById 404 when not found", async () => {
    jest.spyOn(Blog, "findById").mockReturnValue({ lean: async () => null });
    const { req, res } = createReqRes({ params: { blogId: "abc" } });
    await blogController.getBlogById(req, res);
    expect(res.jsonPayload.success).toBe(false);
  });

  test("togglePublish flips flag and saves", async () => {
    const fakeBlog = {
      isPublished: false,
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(Blog, "findById").mockResolvedValue(fakeBlog);
    const { req, res } = createReqRes({ body: { id: "1" } });
    await blogController.togglePublish(req, res);
    expect(fakeBlog.isPublished).toBe(true);
    expect(res.jsonPayload.success).toBe(true);
  });

  test("addComment succeeds", async () => {
    jest.spyOn(Comment, "create").mockResolvedValue({ _id: "c1" });
    const { req, res } = createReqRes({
      body: { blog: "b", name: "n", content: "c" },
    });
    await blogController.addComment(req, res);
    expect(res.jsonPayload.success).toBe(true);
  });

  test("generateContent returns AI content", async () => {
    // Mock main imported inside controller via dynamic override: spy on default export of module
    const { req, res } = createReqRes({ body: { prompt: "topic" } });
    await blogController.generateContent(req, res);
    expect(res.jsonPayload.success).toBe(true);
    expect(typeof res.jsonPayload.content).toBe("string");
  });

  test("generateContent returns failure on AI error", async () => {
    const mod = await import("../configs/gemini.js");
    jest.spyOn(mod, "default").mockRejectedValue(new Error("ai fail"));
    const { req, res } = createReqRes({ body: { prompt: "topic" } });
    await blogController.generateContent(req, res);
    expect(res.jsonPayload.success).toBe(false);
  });

  test("getAllBlogsAdmin returns list", async () => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      select: () => chain,
      lean: async () => [{ _id: "1" }],
    };
    jest.spyOn(Blog, "find").mockReturnValue(chain);
    const { req, res } = createReqRes({ query: { page: "1", limit: "2" } });
    await adminController.getAllBlogsAdmin(req, res);
    expect(res.jsonPayload.success).toBe(true);
  });

  test("getAllBlogsAdmin returns error on exception", async () => {
    jest.spyOn(Blog, "find").mockImplementation(() => {
      throw new Error("boom");
    });
    const { req, res } = createReqRes();
    await adminController.getAllBlogsAdmin(req, res);
    expect(res.jsonPayload.success).toBe(false);
  });

  test("getAllComments returns list", async () => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      select: () => chain,
      lean: async () => [{ _id: "1" }],
    };
    jest.spyOn(Comment, "find").mockReturnValue(chain);
    const { req, res } = createReqRes({ query: { page: "1", limit: "2" } });
    await adminController.getAllComments(req, res);
    expect(res.jsonPayload.success).toBe(true);
  });

  test("getAllComments returns error on exception", async () => {
    jest.spyOn(Comment, "find").mockImplementation(() => {
      throw new Error("boom");
    });
    const { req, res } = createReqRes();
    await adminController.getAllComments(req, res);
    expect(res.jsonPayload.success).toBe(false);
  });

  test("getDashboard returns counts", async () => {
    jest.spyOn(Blog, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({ select: () => ({ lean: async () => [] }) }),
      }),
    });
    jest.spyOn(Blog, "estimatedDocumentCount").mockResolvedValue(2);
    jest.spyOn(Comment, "estimatedDocumentCount").mockResolvedValue(1);
    jest.spyOn(Blog, "countDocuments").mockResolvedValue(1);
    const { req, res } = createReqRes();
    await adminController.getDashboard(req, res);
    expect(res.jsonPayload.success).toBe(true);
    expect(res.jsonPayload.dashboardData.blogs).toBe(2);
  });
});
