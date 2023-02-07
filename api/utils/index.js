import jwt from "jsonwebtoken";
import { params } from "@serverless/cloud";

export function protect(req, res, next) {
  const token = req.cookies.user;
  try {
      const user = jwt.verify(token, params.JWT_SECRET);
      req.user = user;
      next()
  } catch (error) {
      res.json({ error, message: "logged out" });
  }
}

export function ensureHttps(req, res, next) {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
}

export function validateHostName(clientHost, validHost) {
  return clientHost === validHost;
}