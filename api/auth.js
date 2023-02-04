import { params } from "@serverless/cloud";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import session from "express-session";
const domain = "https://exciting-project-3awb8b.cloud.serverless.com";

export default async (api) => {

// Use the cookie-parser middleware
api.use(cookieParser());
api.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60*1000 // 1 hour
  }
}));

// Initialize passport
api.use(passport.initialize());

// Use the Google OAuth 2.0 strategy
passport.use(
  new Strategy(
    {
      clientID: params.GOOGLE_ID,
      clientSecret: params.GOOGLE_SECRET,
      callbackURL: `${domain}/login/auth/google/callback`,
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, cb) => {
      return cb(null, { accessToken, refreshToken, profile });
    }
  )
);

// Serialize and deserialize the user
passport.serializeUser((user, cb) => {
  // Serialize the user data and set it as a signed JWT in the cookie
  const token = jwt.sign(user, params.JWT_SECRET);
  res.cookie("user", token, {
    secure: true, // set the secure flag to ensure the cookie is sent over HTTPS only
    httpOnly: true, // set the httpOnly flag to prevent client-side access to the cookie
    // maxAge: 60 * 60 * 24 * 30 // set the max age to 30 days
    maxAge: 60*1000
  });
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  // Deserialize the user data from the cookie
  const token = req.cookies.user;
  try {
    const user = jwt.verify(token, params.JWT_SECRET);
    cb(null, user);
  } catch (error) {
    cb(error, null);
  }
});

api.get("/login/auth/google", passport.authenticate("google", { scope: ["email"] }));

// Define the callback route
api.get(
  "/login/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/login/protected");
  }
);

api.get("/:component/protected", (req, res) => {
  // Read the user data from the cookie
  const token = req.cookies.user;
  try {
    const user = jwt.verify(token, params.JWT_SECRET);
    res.json(user || "logged out");
  } catch (error) {
    res.json({ error, message: "logged out" });
  }
});

}
