export function isLoggedIn(req, res, next) {
  // Read the user data from the cookie
  const token = req.cookies.user;
  try {
    const user = jwt.verify(token, "JWT_SECRET");
    console.log({ user });
    next();
  } catch (error) {
    res.json({ error, message: "logged out" });
  }
}