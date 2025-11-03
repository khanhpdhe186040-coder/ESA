const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (decoded.roleId !== "r3") {
      return res.status(403).json({ message: "Forbidden: Students only" });
    }

    req.user = decoded;

    next();
  } catch (err) {
    console.error("Authentication error (authStudent):", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
