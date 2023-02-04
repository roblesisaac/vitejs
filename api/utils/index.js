import jwt from "jsonwebtoken";

export function protect(req, res, next) {
  const token = req.cookies.user;
  try {
    const user = jwt.verify(token, "JWT_SECRET");
    next()
  } catch (error) {
    res.json({ error, message: "logged out" });
  }
}