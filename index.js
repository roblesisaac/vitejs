import { api, events, http, params, data } from '@serverless/cloud';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss-clean';
import bcrypt from 'bcryptjs';

import db from './api/db';
import { isValidEmail, randomString } from './src/utils';
import userEvents from './api/events/userEvents.js';
import CustomStore from './api/utils/CustomStore';

const {
  SESSION_ID, 
  GOOGLE_ID,
  GOOGLE_SECRET,
  CLOUD_URL
} = params;

const hostName = CLOUD_URL.replace('https://', '');
const domain = '.'+hostName;

api.use(session({
  genid: req => req.sessionID,
  secret: SESSION_ID,
  resave: false,
  saveUninitialized: true,
  store: new (CustomStore(session))(),
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    domain,
    maxAge: (60*60) * 1000,
    signed: true
  }
}));

api.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
}));

api.use(xss());

api.use((req, res, next) => {
  if (!req.sessionID) {
    req.sessionID = uuidv4();
  }
  next();
});

api.use(passport.initialize());
api.use(passport.session());

function loginUser(req, res, user) {
  return req.logIn(user, (err) => {
    if (err) { 
      return res.status(400).json(err); 
    }
    
    return res.json("Success");
  });
}

async function publishUserEvent(payload, email) {
  // await events.publish('user.joined', payload);
  // await events.publish('user.checkForVerificationWarning', { after: '24 hours' }, payload);
  // await events.publish('user.checkForVerification', { after: '48 hours' }, { email });
}

function validateHostName(clientHost, validHost) {
  return clientHost === validHost;
}

function verify(req, res, next) {
  if(!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  next();
}

userEvents(data, events, params);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

async function authLocalUser(email, password, done) {
  let errorMessage;

  if (!email || !password) {
    errorMessage = `Missing "email" or "password" properties.`;
    return done(errorMessage, false);
  }

  const user = await data.get(`users:${email}`);

  if (!user) {
    errorMessage = `Sorry, we couldn't find an account associated with <b>${email}</b>. Please sign up to create an account.`;

    return done(errorMessage, false);
  }

  if(!user.hash) {
    errorMessage = `The email <b>${email}</b> is already associated with a Google account. Please log in using your Google account.`;

    return done(errorMessage, false);
  }

  const isCorrectPassword = await bcrypt.compare(password, user.hash);

  if (!isCorrectPassword) {
    errorMessage = `The password you provided is incorrect.`;
    return done(errorMessage, false);
  }

  return done(null, user);
}

passport.use(
  new LocalStrategy({ usernameField: 'email' }, authLocalUser)
);

async function authGoogleUser(req, accessToken, refreshToken, profile, done) {
  const { email } = JSON.parse(profile._raw);
  const emailExists = await data.get(`users:${email}`);
  let user = { email, accessToken, refreshToken };

  if(!emailExists) {
    user.status = randomString();
    publishUserEvent(user, email);
  }
  
  await data.set(`users:${email}`, user);

  const validClientHost = validateHostName('.'+req.headers.host, domain);

  if(!validClientHost) {
    return done(new Error('Invalid hostname'));
  }

  return done(null, user);
}

passport.use(
  new GoogleStrategy({
    clientID: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
    callbackURL: `${CLOUD_URL}/login/auth/google/callback`,
    passReqToCallback: true
  },
  authGoogleUser)
);

api.post('/login/native', 
  (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if (err) { 
        return res.status(400).json(err); 
      }

      loginUser(req, res, user);
    })(req, res, next);
  }
);

api.get(
  '/login/auth/google',
  passport.authenticate('google', { scope: ['email'] })
);

api.get(
  '/login/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }), 
  (req, res) => {
    res.redirect('/');
  }
);

api.post("/signup/native", async (req, res) => {
  const { email, password } = req.body;

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
  const user = { email, hash, status };

  await data.set(`users:${email}`, user);
  publishUserEvent(user, email);

  loginUser(req, res, user);
});

api.get('/logout', verify, function(req, res) {
  req.logout(function(err) {
      if (err) {
        console.log(err);
      }
      res.redirect('/');
  });
});

//dbs
const endpoint = '/:component/db/';
api.get(endpoint, verify, (req, res) => db.find(req, res));
api.get(endpoint+':id', (req, res) => db.findOne(req, res));

api.put(endpoint+':id', (req, res) => db.updateOne(req, res));
api.put(endpoint, (req, res) => db.updateMany(req, res));

api.post(endpoint, (req, res) => db.insert(req, res));

api.delete(endpoint+':id', (req, res) => db.deleteOne(req, res));
api.delete(endpoint, (req, res) => db.deleteMany(req, res));

http.on(404, 'index.html');

// Catch all for missing API routes
api.get('/:component/api/*', (req, res) => {
  res.status(404).send({ error: `${component} not found` });
});