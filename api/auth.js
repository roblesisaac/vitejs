import passport from "passport";
import { Strategy }  from "passport-google-oauth20";
import { api, params } from "@serverless/cloud";
import session from "express-session";
const domain = "https://exciting-project-3awb8b.cloud.serverless.com";


export default async (req, res) => {
  api.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
  }));
  
  passport.use(
    new Strategy({
      clientID: params.GOOGLE_ID,
      clientSecret: params.GOOGLE_SECRET,
      callbackURL: `${domain}/login/auth/google/callback`
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
  
  api.get('/:component/auth/google', passport.initialize(), passport.session(), passport.authenticate('google', { scope: ['email'] }), (req, res) => {
    res.json("logged in with google!");
  });
  
  // Define the endpoint for handling the callback from Google
  api.get('/:component/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
  });
}