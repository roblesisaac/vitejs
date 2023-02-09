import { api, http, params } from "@serverless/cloud";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import expressSession from "express-session";
import tlsCheck from "tls-check";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import xss from "xss-clean";

import db from "./api/db.js";

// create rate-limiter
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});

api.use(limiter);

const { 
  SESSION_ID, 
  COOKIE_KEY,
  GOOGLE_ID,
  GOOGLE_SECRET,
  JWT_SECRET,
  CLOUD_URL
} = params;

const hostName = CLOUD_URL.replace("https://", "");
const domain = "."+hostName;

function ensureHttps(req, res, next) {
  if (req.hostname !== hostName) {
    res.status(400).send({ error: "Invalid host name" });
    return;
  }

  if (!req.secure) {
    try {
      tlsCheck({ hostname: req.headers.host }).then(function(err, result) {
        if (!err && result.valid_cert) {
          console.log("Supported Cipher Suites: ", result.cipher_suites);
          return res.redirect(`https://${req.headers.host}${req.url}`);
        } else {
          console.log({ err });
          return res.status(500).send("An error occurred while trying to redirect to HTTPS. Please try again later.");
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send("An error occurred while trying to redirect to HTTPS. Please try again later.");
    }
  }
  
  next();
}

function validateHostName(clientHost, validHost) {
  return clientHost === validHost;
}

function generateToken(user) {
  const expiration = Math.floor(Date.now() / 1000) + (60 * 60);
  return jwt.sign({ user, exp: expiration }, JWT_SECRET, { algorithm: "HS256" });
}

function assignCookie(res, data, cookieName) {
  const userString = JSON.stringify(data);
  const secretLength = 128;
  const secret = crypto.randomBytes(Math.ceil(secretLength/2)).toString("hex").slice(0,secretLength);
  const hash = crypto.createHmac("sha512", secret)
        .update(userString)
        .digest("hex");

  const token = generateToken(hash);
      
  res.cookie(cookieName, token, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    domain,
    maxAge: (60*60) * 1000,
    signed: true
  });
}

function verify(req, res, next) {
  const token = req.signedCookies.user;
  const origin = req.origin;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithm: "HS256" });

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Token has expired");
    }

    // if (origin !== decoded.origin) {
    //   throw new Error("Invalid cookie origin");
    // }

    req.user = decoded.user;
    
    next();
  } catch (error) {
    res.json({ error, message: "logged out" });
  }
}

function logoutUser(req, res) {
  req.logout((err) => {
    if (err) {
      console.log(`Error logging out: ${ err }`);
      return;
    }

    res.cookie("user", "", {
      expires: new Date(0),
      path: "/",
      domain: "."+req.headers.host
    });
          
    res.redirect("/");
  });
}

api.use(function (req, _res, next) {
  var protocol = req.protocol;

  var hostHeaderIndex = req.rawHeaders.indexOf("Host") + 1;
  var host = hostHeaderIndex ? req.rawHeaders[hostHeaderIndex] : undefined;

  Object.defineProperty(req, "origin", {
    get: function () {
      if (!host) {
        return req.headers.referer ? req.headers.referer.substring(0, req.headers.referer.length - 1) : undefined;
      }
      else {
        return protocol + "://" + host;
      }
    }
  });

  next();
});

api.use(cookieParser(COOKIE_KEY));
api.use(xss());
api.use(ensureHttps);

api.use((req, res, next) => {
  if (!req.sessionID) {
    req.sessionID = uuidv4();
  }
  next();
});

api.get("/:component/protected", (req, res) => {
  res.json(req.sessionID);
});

api.use(expressSession({
  genid: (req) => {
    return req.sessionID;
  },
  secret: SESSION_ID,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    domain,
    maxAge: (60*60) * 1000,
    signed: true
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
    // save to db;
    // console.log("save to db");
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
  "/login/auth/google",
  passport.authenticate("google", { scope: ["email"], session: false })
);

// Define the callback route
api.get(
  "/login/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login", session: false }), 
  (req, res) => {

    assignCookie(res, req.user, "user");

    res.redirect("/");
  }
);

api.get("/logout", logoutUser);

api.get("/:component/sessionId", (req, res) => {
  res.json({ sessionId: req.sessionID })
})

//dbs
const endpoint = "/:component/db/";
api.get(endpoint, verify, (req, res) => db.find(req, res));
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