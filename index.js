import { api, events, http, params, data } from "@serverless/cloud";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import session from "express-session";
import tlsCheck from "tls-check";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import xss from "xss-clean";
import bcrypt from "bcryptjs";

import db from "./api/db";
import { isValidEmail, randomString } from "./src/utils";
import userEvents from "./api/events/userEvents.js";

userEvents(data, events, params);

const {
  SESSION_ID, 
  COOKIE_KEY,
  GOOGLE_ID,
  GOOGLE_SECRET,
  CLOUD_URL,
  CRYPT_KEY,
  CRYPT_IV,
  RSA_PRIVATE,
  RSA_PUBLIC
} = params;

const ENCRYPT_KEY = JSON.parse(CRYPT_KEY);
const ENCRYPT_IV = JSON.parse(CRYPT_IV);
const hostName = CLOUD_URL.replace("https://", "");
const domain = "."+hostName;
const RSA = { 
  PRIVATE: RSA_PRIVATE.replace(/\\n/g, '\n'), 
  PUBLIC: RSA_PUBLIC.replace(/\\n/g, '\n') 
};

api.use(session({
  genid: req => req.sessionID,
  secret: SESSION_ID,
  resave: false,
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

// create rate-limiter
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});

api.use(limiter);

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

function encrypt(text) {
  let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY, 'hex'), Buffer.from(ENCRYPT_IV, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(encrypted) {
  let encryptedText = Buffer.from(encrypted, 'hex');
  let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY, 'hex'), Buffer.from(ENCRYPT_IV, 'hex'));
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function generateToken(payload) {
  const exp = Math.floor(Date.now() / 1000) + (60 * 60);
  return jwt.sign({ payload, exp }, RSA.PRIVATE, { algorithm: "RS256" });
}

function assignCookie(res, data, cookieName) {
  const token = generateToken(data),
        encrypted = encrypt(token);
      
  res.cookie(cookieName, encrypted, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    domain,
    maxAge: (60*60) * 1000,
    signed: true
  });
}

function decodeJWT(token) {
  return jwt.verify(token, RSA.PUBLIC, { algorithm: "RS256" });
}

function verify(req, res, next) {
  const encrypted = req.signedCookies.auth;

  if(!encrypted) {
    res.json({ message: "Please log in to continue." });
    return;
  }
  
  try {
    const decrypted = decrypt(encrypted);
    const decoded = decodeJWT(decrypted);
    const { payload, exp, iat } = decoded;
    const { user, origin } = payload;

    if (exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Token has expired");
    }

    // if (req.origin !== origin) {
    //   console.log("Error validating cookie.");
    //   throw new Error("Invalid cookie origin");
    // }

    req.user = user;
    
    next();
  } catch (error) {
    console.log({ error });
    res.json({ error, message: "logged out" });
  }
}

function logoutUser(req, res) {
  req.logout((err) => {
    if (err) {
      console.log(`Error logging out: ${ err }`);
      return;
    }

    res.cookie("auth", "", {
      expires: new Date(0),
      path: "/",
      domain: "."+req.headers.host
    });
          
    res.redirect("/");
  });
}

function setOrigin(req, _res, next) {
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
}

api.use(setOrigin);
api.use(cookieParser(COOKIE_KEY));
api.use(xss());
api.use(ensureHttps);

api.use((req, res, next) => {
  if (!req.sessionID) {
    req.sessionID = uuidv4();
  }
  next();
});

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

    assignCookie(res, {
      user: req.user,
      origin: CLOUD_URL
    }, "auth");

    res.redirect("/");
  }
);

api.post("/signup/native", async (req, res) => {
  const { email, password, profile } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(`Missing "email" or "password" properties.`);
  }

  if(!isValidEmail(email)) {
    return res
      .status(400)
      .json(`Email: "${ email }" is invalid. Please enter a valid email address.`);
  }

  const emailExists = await data.get(`users:${email}`);

  if (emailExists) {
    return res.status(400).json(`Email ${email} already exists.`);
  }

  if (password.length < 8) {
    return res.status(400).json(`Password must be at least 8 character.`);
  }
  
  async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  const hash = await hashPassword(password);
  const status = randomString();
  const payload = { email, hash, profile, status };

  await data.set(`users:${email}`, payload);
  await events.publish("user.joined", payload);
  await events.publish("user.checkForVerificationWarning", { after: "20 seconds" }, payload);
  await events.publish("user.checkForVerification", { after: "30 seconds" }, { email });

  assignCookie(res, {
    user: payload,
    origin: CLOUD_URL
  }, "auth");

  res.json("Success"); 
});

api.get("/signup/verify/:encrypted", async (req, res) => {
  const { encrypted } = req.params;

  const decrypted = decrypt(encrypted);
  const decoded = decodeJWT(decrypted);
  const { email, status } = decoded.payload;

  const user = await data.get(`users:${email}`);

  if(!user) {
    return res.send(`<h1>${ email } not found. Please, <a href="${CLOUD_URL}">Click Here</a> to sign up.</h1>`);
  }

  // check if user.status is equal to the random string assigned at signup
  if(user.status === status) {
    user.status = "verified";
    await data.set(`users:${email}`, user);
  }

  if(user.status === "verified") {
    return res.redirect("/");
  }

  res.send(`<h1>${ email } not found. Please, <a href="${CLOUD_URL}">Click Here</a> to sign up.</h1>`);
});

api.post("/login/native", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(`Missing "email" or "password" properties.`);
  }

  const getUserByEmail = (email, options) => data.get(`users:${email}`, options);
  const user = await getUserByEmail(email);

  if (!user) {
    return res.status(400).json(`Email ${email} does not exist.`);
  }

  const isCorrectPassword = await bcrypt.compare(password, user.hash);

  if (!isCorrectPassword) {
    return res
      .status(400)
      .json(`The password you provided is not correct.`);
  }

  assignCookie(res, {
    user,
    origin: CLOUD_URL
  }, "auth");

  res.json("Success");
});

api.get("/logout", logoutUser);

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