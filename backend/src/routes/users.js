const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const verifyToken = require("../middleware/auth");
const generateUsername = require("../utils/usernameGenerator");

// GET /api/user - Get user data
router.get("/", verifyToken, async (req, res) => {
  console.log("Received request to get user data");
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      req.user.uid,
    ]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
      console.log("Successfully sent user data");
    } else {
      res.status(404).json({ message: "User not found" });
      console.log("User not found in database");
    }
    client.release();
  } catch (err) {
    console.error("Error in /api/user GET route:", err);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// POST /api/user - Create or update user
router.post("/", verifyToken, async (req, res) => {
  console.log("Received request to create/update user");
  console.log("User data from token:", req.user);
  console.log("Request body:", req.body);

  const { uid, email } = req.user;
  const name = req.user.name || req.body.name;

  try {
    const client = await pool.connect();
    // Start transaction
    await client.query("BEGIN");

    try {
      // Check if user exists
      const userCheck = await client.query(
        "SELECT username FROM users WHERE id = $1",
        [uid]
      );

      if (userCheck.rows.length === 0) {
        // New user - generate username
        const username = await generateUsername(client, email);
        // Insert new user with username
        await client.query(
          "INSERT INTO users (id, email, name, username) VALUES ($1, $2, $3, $4)",
          [uid, email, name, username]
        );
      } else {
        // Existing user - update info but keep username
        await client.query(
          "UPDATE users SET email = $2, name = $3 WHERE id = $1",
          [uid, email, name]
        );
      }

      await client.query("COMMIT");

      // Get the current user data to send back
      const userData = await client.query(
        "SELECT id, email, name, username FROM users WHERE id = $1",
        [uid]
      );

      res.status(200).json({
        message: "User data saved",
        user: userData.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in /api/user POST route:", err);
    res.status(500).json({ error: err.message || "An unknown error occurred" });
  }
});

module.exports = router;
