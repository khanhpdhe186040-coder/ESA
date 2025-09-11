const jwt = require("jsonwebtoken");

function basicAuth(req, res, next) {}

function jwtAuth(req, res, next) {
  const reqToken = req.header("Authorization")?.replace("Bearer ", "");
  if (!reqToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(reqToken, process.env.JWT_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { basicAuth, jwtAuth };
