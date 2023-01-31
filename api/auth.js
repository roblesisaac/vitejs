import passport from "passport";
import { Strategy }  from "passport-google-oauth20";
import { api, params } from "@serverless/cloud";
import session from "express-session";

api.get("/:component/jsonData", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json([{ data: "item" }]);
});

api.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

passport.use(
  new Strategy({
    clientID: params.GOOGLE_ID,
    clientSecret: params.GOOGLE_SECRET,
    callbackURL: `https://pragmatic-binary-atdgy.cloud.serverless.com/plaza/auth/google/callback`
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log({accessToken, refreshToken, profile});
    return cb(null, profile);
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

const noCache = function(req, res, next) {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  next();
};

api.get('/:component/auth/google', 
passport.initialize(), 
passport.session(),
noCache, 
passport.authenticate('google', { scope: ['email'] }));

// Define the endpoint for handling the callback from Google
api.get('/:component/auth/google/callback', noCache, passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/');
});



export default async (req, res) => {
  res.json("hi");

  // res.json({ passport, respond, message: "Hi" });

  // const respond = output => res.json(output);

  // mongo.insert._import({ res, req })("users", { name: 12 })
  //   .then(respond)
  //   .catch(respond);
}