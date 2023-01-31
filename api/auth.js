import { Pipe } from "../utils/pipe.js";
import mongo from "../utils/mongo.js";
import passport from "passport";
import { Strategy }  from "passport-google-oauth20";
import { params } from "@serverless/cloud";

export default async (req, res, api) => {
  // api.use(passport.initialize());
  // api.use(passport.session());

  const respond = output => res.json(output);

  passport.use(
    new Strategy({
      clientID: params.GOOGLE_ID,
      clientSecret: params.GOOGLE_SECRET,
      callbackURL: `https://pragmatic-binary-atdgy.cloud.serverless.com/auth/google/callback`
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
  

  passport.authenticate('google', { scope: ['profile'] });

  // res.json({ passport });

  // mongo.insert._import({ res, req })("users", { name: 12 })
  //   .then(respond)
  //   .catch(respond);
}