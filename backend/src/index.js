const express = require("express");
const cors = require("cors");
const awsServerlessExpress = require("aws-serverless-express");
require("dotenv").config();

const testRoutes = require("./routes/test");
const userRoutes = require("./routes/users");
const bookRoutes = require("./routes/books");

const app = express();
const port = 3000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://frontend-dev:5173",
      "http://localhost:3000",
      // Add Amplify frontend URL when deployed
      process.env.FRONTEND_URL,
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

// Local development server
if (process.env.NODE_ENV === "development") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend running on http://0.0.0.0:${port}`);
  });
}

// Create server for Lambda
const server = awsServerlessExpress.createServer(app);

// Lambda handler
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};

// Export app for local development
module.exports = app;
