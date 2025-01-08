const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const verifyToken = require("../middleware/auth");

// POST /api/books - Add a book to user's collection
router.post("/", verifyToken, async (req, res) => {
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

// GET /api/books/:username - Get user's book collection
router.get("/user/:username", async (req, res) => {
  console.log(
    "Received request to get books for username:",
    req.params.username
  );
  try {
    const client = await pool.connect();
    // First get the user ID from the username
    const userResult = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [req.params.username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;
    const result = await client.query(
      `SELECT b.id, b.google_books_id, b.title, b.authors, b.thumbnail_url, ub.status
       FROM books b
       JOIN user_books ub ON b.id = ub.book_id
       WHERE ub.user_id = $1`,
      [userId]
    );

    client.release();
    res.json({ books: result.rows });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Error fetching books" });
  }
});

// DELETE /api/books/:bookId/library - Remove book from user's library
router.delete("/:bookId/library", verifyToken, async (req, res) => {
  console.log("Received request to remove a book from user's library");
  const { uid } = req.user;
  const { bookId } = req.params;

  try {
    const client = await pool.connect();
    console.log("Connected to database");
    await client.query("BEGIN");
    console.log("Transaction begun");

    try {
      // Only remove from user_books table, keep the book in books table
      await client.query(
        "DELETE FROM user_books WHERE user_id = $1 AND book_id = $2",
        [uid, bookId]
      );
      console.log("Book removed from user's collection");

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

// PATCH /api/books/:bookId - Update book status
router.patch("/:bookId", verifyToken, async (req, res) => {
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

// GET /api/popular - Get popular books
router.get("/popular", async (req, res) => {
  console.log("Received request to get popular books");
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT b.id, b.google_books_id, b.title, b.authors, b.thumbnail_url, b.add_count
       FROM books b
       WHERE b.add_count > 0
       ORDER BY b.add_count DESC
       LIMIT 10`
    );
    client.release();
    res.json({ books: result.rows });
  } catch (err) {
    console.error("Error fetching popular books:", err);
    res.status(500).json({ error: "Error fetching popular books" });
  }
});

// GET /api/books/details/:bookId - Get book details
router.get("/details/:bookId", async (req, res) => {
  console.log("Received request to get book details");
  const { bookId } = req.params;

  try {
    const client = await pool.connect();
    // Get book details and count of users who have this book
    const result = await client.query(
      `SELECT b.*, 
              COUNT(DISTINCT ub.user_id) as reader_count,
              json_agg(
                json_build_object(
                  'username', u.username,
                  'status', ub.status
                )
              ) as readers
       FROM books b
       LEFT JOIN user_books ub ON b.id = ub.book_id
       LEFT JOIN users u ON ub.user_id = u.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [bookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching book details:", err);
    res.status(500).json({ error: "Error fetching book details" });
  }
});

module.exports = router;
