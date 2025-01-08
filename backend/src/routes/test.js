const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// GET /api - Test route
router.get("/", async (req, res) => {
  console.log("Received request to /api");
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    res.json({
      message: "Hello from Express!",
      time: result.rows[0].now,
    });
    client.release();
    console.log("Successfully responded to /api request");
  } catch (err) {
    console.error("Error in /api route:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

module.exports = router;
