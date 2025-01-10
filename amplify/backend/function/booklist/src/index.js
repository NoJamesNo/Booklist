const express = require("express");
const cors = require("cors");
require("dotenv").config();
const testRoutes = require("./routes/test");
const userRoutes = require("./routes/users");
const bookRoutes = require("./routes/books");
const awsServerlessExpress = require("aws-serverless-express");

const app = express();
const server = awsServerlessExpress.createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://frontend-dev:5173",
      "http://localhost:3000",
      "https://novelog.app",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Routes
app.use("/api", testRoutes);
app.use("/api/user", userRoutes);
app.use("/api/books", bookRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred" });
});

exports.handler = (event, context) => {
  return awsServerlessExpress.proxy(server, event, context);
};
