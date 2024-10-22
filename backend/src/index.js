const express = require("express");
const { Pool } = require("pg");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3000;

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://frontend-dev:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "myapp",
  port: process.env.DB_PORT || 5432,
});
console.log("PostgreSQL pool created");

const verifyToken = async (req, res, next) => {
  console.log("Verifying token...");
  const idToken = req.headers.authorization;
  console.log(
    "Received token:",
    idToken ? idToken.substring(0, 20) + "..." : "No token"
  );

  if (!idToken) {
    console.log("No token provided");
    return res.status(403).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Token verified successfully for user:", decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(403).json({ error: `Invalid token: ${error.message}` });
  }
};

// Test route (public)
app.get("/api", async (req, res) => {
  console.log("Received request to /api");
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    res.json({ message: "Hello from Express!", time: result.rows[0].now });
    client.release();
    console.log("Successfully responded to /api request");
  } catch (err) {
    console.error("Error in /api route:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Protected route - User data
app.get("/api/user", verifyToken, async (req, res) => {
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

// Protected route - Create or update user
app.post("/api/user", verifyToken, async (req, res) => {
  console.log("Received request to create/update user");
  console.log("User data from token:", req.user);
  console.log("Request body:", req.body);

  const { uid, email } = req.user;
  const name = req.user.name || req.body.name;

  try {
    const client = await pool.connect();
    await client.query(
      "INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = $2, name = $3",
      [uid, email, name]
    );
    res.status(200).json({ message: "User data saved" });
    client.release();
    console.log("Successfully created/updated user:", uid);
  } catch (err) {
    console.error("Error in /api/user POST route:", err);
    res.status(500).json({ error: err.message || "An unknown error occurred" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred" });
});
app.post("/api/books", verifyToken, async (req, res) => {
  console.log("Received request to add a book");
  console.log("Request body:", req.body);
  const { uid } = req.user;
  const { id: google_books_id, title, authors, imageLinks, status } = req.body;

  try {
    const client = await pool.connect();
    console.log("Connected to database");

    await client.query("BEGIN");
    console.log("Transaction begun");

    try {
      // Check if the book already exists in the books table
      let bookResult = await client.query(
        "SELECT id FROM books WHERE google_books_id = $1",
        [google_books_id]
      );
      console.log("Book query result:", bookResult.rows);

      let bookId;
      if (bookResult.rows.length === 0) {
        // If the book doesn't exist, insert it
        const insertBookResult = await client.query(
          "INSERT INTO books (google_books_id, title, authors, thumbnail_url, add_count) VALUES ($1, $2, $3, $4, 1) RETURNING id",
          [google_books_id, title, authors, imageLinks?.thumbnail]
        );
        bookId = insertBookResult.rows[0].id;
        console.log("New book inserted, id:", bookId);
      } else {
        bookId = bookResult.rows[0].id;
        // Increment the add_count
        await client.query(
          "UPDATE books SET add_count = add_count + 1 WHERE id = $1",
          [bookId]
        );
        console.log(
          "Existing book found, id:",
          bookId,
          "add_count incremented"
        );
      }

      // Add or update the book in the user's collection
      await client.query(
        "INSERT INTO user_books (user_id, book_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id, book_id) DO UPDATE SET status = $3",
        [uid, bookId, status]
      );
      console.log("Book added/updated in user's collection");

      await client.query("COMMIT");
      console.log("Transaction committed");
      res.status(200).json({ message: "Book added/updated in collection" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error in transaction, rolled back:", err);
      throw err;
    } finally {
      client.release();
      console.log("Database client released");
    }
  } catch (err) {
    console.error("Error in /api/books POST route:", err);
    res.status(500).json({ error: err.message || "An unknown error occurred" });
  }
});
app.get("/api/books", verifyToken, async (req, res) => {
  console.log("Received request to get books");
  const { uid } = req.user;

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT b.id, b.google_books_id, b.title, b.authors, b.thumbnail_url, ub.status 
       FROM books b 
       JOIN user_books ub ON b.id = ub.book_id 
       WHERE ub.user_id = $1`,
      [uid]
    );
    client.release();

    res.json({ books: result.rows });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Error fetching books" });
  }
});

app.delete("/api/books/:bookId", verifyToken, async (req, res) => {
  console.log("Received request to remove a book");
  const { uid } = req.user;
  const { bookId } = req.params;

  try {
    const client = await pool.connect();
    console.log("Connected to database");

    await client.query("BEGIN");
    console.log("Transaction begun");

    try {
      // Remove the book from the user's collection
      await client.query(
        "DELETE FROM user_books WHERE user_id = $1 AND book_id = $2",
        [uid, bookId]
      );
      console.log("Book removed from user's collection");

      // Decrement the add_count
      await client.query(
        "UPDATE books SET add_count = add_count - 1 WHERE id = $1",
        [bookId]
      );
      console.log("Book add_count decremented");

      // Optionally, remove the book entirely if add_count reaches 0
      await client.query("DELETE FROM books WHERE id = $1 AND add_count = 0", [
        bookId,
      ]);

      await client.query("COMMIT");
      console.log("Transaction committed");
      res.status(200).json({ message: "Book removed from collection" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error in transaction, rolled back:", err);
      throw err;
    } finally {
      client.release();
      console.log("Database client released");
    }
  } catch (err) {
    console.error("Error in /api/books DELETE route:", err);
    res.status(500).json({ error: err.message || "An unknown error occurred" });
  }
});

app.patch("/api/books/:bookId", verifyToken, async (req, res) => {
  console.log("Received request to update book status");
  const { uid } = req.user;
  const { bookId } = req.params;
  const { status } = req.body;

  try {
    const client = await pool.connect();
    console.log("Connected to database");

    await client.query("BEGIN");
    console.log("Transaction begun");

    try {
      // Update the book status in the user's collection
      await client.query(
        "UPDATE user_books SET status = $1 WHERE user_id = $2 AND book_id = $3",
        [status, uid, bookId]
      );
      console.log("Book status updated in user's collection");

      await client.query("COMMIT");
      console.log("Transaction committed");
      res.status(200).json({ message: "Book status updated" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error in transaction, rolled back:", err);
      throw err;
    } finally {
      client.release();
      console.log("Database client released");
    }
  } catch (err) {
    console.error("Error in /api/books PATCH route:", err);
    res.status(500).json({ error: err.message || "An unknown error occurred" });
  }
});
