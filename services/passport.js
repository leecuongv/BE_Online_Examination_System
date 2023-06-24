import bcrypt from "bcrypt";
import { User } from '../models/User.js';
import { STATUS, TYPE_ACCOUNT } from '../utils/enum.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from 'passport';
import * as PassportGoogle from 'passport-google-oauth20';
const GoogleStrategy = PassportGoogle.Strategy
dotenv.config()
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
});



passport.use(
  new GoogleStrategy({
    clientID: process.env.googleClientID,
    clientSecret: process.env.googleClientSecret,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
    async (accessToken, refreshToken, profile, done) => {

      const existingUser = await User.findOne({ socialId: profile.id });

      if (existingUser) {
        return done(null, existingUser);
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("12345678", salt);
      const user = await new User({
        id: profile.id,
        email: profile.emails[0].value,
        fullname: profile.name.familyName + ' ' + profile.name.givenName,
        birthday: new Date(),
        username: profile.id,
        password: hash,
        status: STATUS.ACTIVE,
        type: TYPE_ACCOUNT.GOOGLE,
        socialId: profile.id,
        avatar: profile.photos[0].value
      }).save();

      done(null, user);
    })
);