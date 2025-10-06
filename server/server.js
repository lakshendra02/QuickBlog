import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import adminRouter from "./routers/adminRoutes.js";
import blogRouter from "./routers/blogRoutes.js";

const app = express();
app.use(express.json());

if (process.env.NODE_ENV !== "test") {
  await connectDB();
}
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/blog", blogRouter);
app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = process.env.PORT || 3000;

// Do not start the HTTP server when running under tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
