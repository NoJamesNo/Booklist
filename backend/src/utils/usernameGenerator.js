async function generateUsername(client, email) {
  let baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  let username = baseUsername;
  let counter = 1;

  while (true) {
    try {
      const usernameCheck = await client.query(
        "SELECT id FROM users WHERE username = $1",
        [username]
      );
      if (usernameCheck.rows.length === 0) {
        return username;
      }
      username = `${baseUsername}${counter}`;
      counter++;
    } catch (err) {
      console.error("Error checking username:", err);
      throw err;
    }
  }
}

module.exports = generateUsername;
