import jwt from "jsonwebtoken";

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "missing_auth_header" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "invalid_auth_header" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
