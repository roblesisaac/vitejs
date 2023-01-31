import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";
import passport from "passport";
import { Strategy }  from "passport-google-oauth20";
import { api, params } from "@serverless/cloud";

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

// api.use(passport.initialize());
// api.use(passport.session());

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

api.get('/:component/auth/google', passport.initialize(), passport.session(), passport.authenticate('google', { scope: ['email'] }));

Define the endpoint for handling the callback from Google
api.get('/:component/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
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