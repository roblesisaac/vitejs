import { api, http, params } from "@serverless/cloud";
import db from "./api/db.js";

import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import expressSession from "express-session";
const domain = "https://exciting-project-3awb8b.cloud.serverless.com";

import { protect } from "./api/utils";

// Check for HTTPS connection
api.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

api.use(cookieParser());
api.use(expressSession({
  secret: "SESSION_SECRET",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: (60*60) * 1000
  }
}));

// Initialize passport 
api.use(passport.initialize());
api.use(passport.session());

// Use the Google OAuth 2.0 strategy
passport.use(
  new Strategy({
    clientID: params.GOOGLE_ID,
    clientSecret: params.GOOGLE_SECRET,
    callbackURL: `${domain}/login/auth/google/callback`
  },
  (accessToken, refreshToken, profile, cb) => {
    return cb(null, { accessToken, refreshToken, profile });
  })
);

// Serialize and deserialize the user
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

api.get('/login/auth/google', passport.authenticate('google', { scope: ['email'] }));

// Define the callback route
api.get('/login/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  const token = jwt.sign(req.user, "JWT_SECRET");
  res.cookie("user", token, {
    secure: true, // set the secure flag to ensure the cookie is sent over HTTPS only
    httpOnly: true, // set the httpOnly flag to prevent client-side access to the cookie
    maxAge: (60*60) * 1000 // set the max age to 1 hour
  });
  res.redirect('/login/protected');
});

api.get("/:component/protected", protect, (req, res) => {
    res.json("protected db!");
});

api.get("/logout", (req, res) => {
    res.clearCookie("user");
    res.redirect("/login");
});

//dbs
const endpoint = "/:component/db/";
api.get(endpoint, (req, res) => db.find(req, res));
api.get(endpoint+":id", (req, res) => db.findOne(req, res));

api.put(endpoint+":id", (req, res) => db.updateOne(req, res));
api.put(endpoint, (req, res) => db.updateMany(req, res));

api.post(endpoint, (req, res) => db.insert(req, res));

api.delete(endpoint+":id", (req, res) => db.deleteOne(req, res));
api.delete(endpoint, (req, res) => db.deleteMany(req, res));

http.on(404, "index.html");

// Catch all for missing API routes
api.get("/:component/api/*", (req, res) => {
  res.status(404).send({ error: `${component} not found` });
});