import { api, http, params } from "@serverless/cloud";
import db from "./api/db.js";

import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import expressSession from "express-session";

function protect(req, res, next) {
    const token = req.cookies.user;
    try {
        const user = jwt.verify(token, params.JWT_SECRET);
        req.user = user;
        next()
    } catch (error) {
        res.json({ error, message: "logged out" });
    }
}
  
function ensureHttps(req, res, next) {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
}
  
function validateHostName(clientHost, validHost) {
    return clientHost === validHost;
}

const { 
    SESSION_ID, 
    COOKIE_KEY,
    GOOGLE_ID,
    GOOGLE_SECRET,
    JWT_SECRET,
    CLOUD_URL
} = params;

const domain = "."+CLOUD_URL.replace("https://", "");

api.use(cookieParser(COOKIE_KEY));

api.use(ensureHttps);

api.use(expressSession({
  secret: SESSION_ID,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    domain,
    maxAge: (60*60) * 1000
  }
}));

// Initialize passport 
api.use(passport.initialize());
api.use(passport.session());

// Use the Google OAuth 2.0 strategy
passport.use(
  new Strategy({
    clientID: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
    callbackURL: `${CLOUD_URL}/login/auth/google/callback`,
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, cb) => {
    const validClientHost = validateHostName("."+req.headers.host, domain);

    if(!validClientHost) cb(new Error("Invalid hostname"));

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

api.get(
    '/login/auth/google',
    passport.authenticate('google', { scope: ['email'], session: false })
);

// Define the callback route
api.get(
    '/login/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }), 
    (req, res) => {
        const token = jwt.sign(req.user, JWT_SECRET);
        
        res.cookie("user", token, {
            secure: true,
            httpOnly: true,
            sameSite: "strict",
            domain,
            maxAge: (60*60) * 1000
        });
        
        res.redirect('/');
    }
);

api.get("/logout", (req, res) => {
    res.cookie("user", "", {
        expires: new Date(0),
        path: "/",
        domain: "."+req.headers.host,
    });
    
    res.redirect("/");
});

//dbs
const endpoint = "/:component/db/";
api.get(endpoint, protect, (req, res) => db.find(req, res));
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