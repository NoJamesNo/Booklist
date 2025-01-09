// backend/src/routes/test.js
const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date(),
  });
});

module.exports = router;
