import passport from "passport";
import { Strategy }  from "passport-google-oauth20";
import { api, params } from "@serverless/cloud";
import session from "express-session";
import noCache from "./noCache";
// import { createServer as createViteServer } from 'vite'

// const vite = await createViteServer({
//   server: { middlewareMode: true },
//   appType: 'custom'
// })

// api.use(vite.middlewares);

api.get("/hello", (req, res) => {
  res.json("hello");
});

api.get("/test/jsonData", noCache, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json([{ data: "items" }]);
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

api.get('/:component/auth/google', 
passport.initialize(), 
passport.session(),
passport.authenticate('google', { scope: ['email'] }), (req, res) => {
  res.json("logged in with google!");
});

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