const admin = require("../config/firebase");

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

module.exports = verifyToken;
