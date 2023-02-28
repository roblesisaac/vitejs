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
import records from './api/utils/records';
import { buildId, isValidEmail, randomString } from './src/utils';
import userEvents from './api/events/userEvents.js';

const CustomStore = function(connect) {
  const Store = connect.Store || connect.sessionStore;

  return class CustomStore extends Store {
      constructor() {
          super()
      }

      async get(sid, callback) {
          const session = await data.get(`sessions:${sid}`);
      
          if (!session) {
            return callback(null, null);
          }
      
          const sess = JSON.parse(session),
              cookie = sess ? sess.cookie : null;
      
          if (cookie && cookie.expires) {
              cookie.expires = new Date(cookie.expires);
          }
          
          if (cookie.expires < new Date()) {
              await this.destroy(sid);
              return callback(null, null);
          }
      
          return callback(null, sess);
      }

      async set(sessionId, session, next) {
          try {
              const id = `sessions:${sessionId}`;
              const payload = JSON.stringify(session);

              const result = await data.set(id, payload, { ttl: 10 });
              next(null, result);
          } catch (err) {
              next(err);
          }
      }

      async destroy(sessionId, next) {
          try {
              const result = await data.remove(`sessions:${sessionId}`);

              if (typeof next == "function") next(null, result);
          } catch (err) {
              console.log(err);
              if(typeof next == "function") next(err);
          }
      }

  }
}

const {
  SESSION_ID, 
  GOOGLE_ID,
  GOOGLE_SECRET,
  CLOUD_URL
} = params;

const hostName = CLOUD_URL.replace('https://', '');
const domain = '.'+hostName;
const users = records("users");

api.use(session({
  genid: req => req.sessionID,
  secret: SESSION_ID,
  resave: false,
  saveUninitialized: false,
  store: new (CustomStore(session))(),
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    domain,
    maxAge: 10*1000, //(60*60) * 1000,
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

async function createNewUser(email, value) {
  const _id = buildId(),
        key = `users:${_id}`;

  if(!value.email_verified) {
    value.email_verified = randomString();
  }

  await data.set(key, value, { label1: email });
  publishUserEvent(value, email);
  
  return { key, ...value};
}

function loginUser(req, res, user) {
  return req.logIn(user, (err) => {
    if (err) { 
      return res.status(400).json(err); 
    }
    
    return res.json("Success");
  });
}

async function publishUserEvent(payload, email) {
  payload.email = email;

  if(payload.email_verified === true) {
    console.log(`Email '${email}' is already verified`);
    return;
  }
  
  console.log(`Published new user '${email}'.`);
  // await events.publish('user.joined', payload);
  // await events.publish('user.checkForVerificationWarning', { after: '24 hours' }, payload);
  // await events.publish('user.checkForVerification', { after: '48 hours' }, { email });
}

function isValidClientHost(clientHost, validHost) {
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
  done(null, user.key);
});
passport.deserializeUser(async (key, done) => {
  done(null, await data.get(key));
});

async function authLocalUser(email, password, done) {
  const errorMessage = `The username or password you provided is incorrect.`;

  if (!email || !password) {
    return done(`Missing "email" or "password" properties.`, false);
  }

  const user = await users.getOne({ email });

  if (!user) {
    return done(errorMessage, false);
  }

  if(!user.hash) {
    return done(`Incorrect login information. Please try again.`, false);
  }

  const isCorrectPassword = await bcrypt.compare(password, user.hash);

  if (!isCorrectPassword) {
    return done(errorMessage, false);
  }

  return done(null, user);
}

passport.use(
  new LocalStrategy({ usernameField: 'email' }, authLocalUser)
);

async function authGoogleUser(req, accessToken, refreshToken, profile, done) {

  if(!isValidClientHost('.'+req.headers.host, domain)) {
    return done(new Error('Invalid hostname'));
  }

  const userData = profile._json,
        { email } = userData,
        existingUser = await users.getOne({ email });

  userData.accessToken = accessToken;

  if(!existingUser) {
    const newUser = await createNewUser(email, userData);

    return done(null, newUser);
  }
  
  await data.set(existingUser.key, userData);

  return done(null, existingUser);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      callbackURL: `${CLOUD_URL}/login/auth/google/callback`,
      passReqToCallback: true
    },
    authGoogleUser
  )
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
  passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' })
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
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  const hash = await hashPassword(password);
  const newUser = await createNewUser(email, { hash });

  loginUser(req, res, newUser);
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