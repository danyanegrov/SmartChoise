import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './database.js';
import { logger } from '../services/logger.js';

export const initializePassport = () => {
  // Google OAuth Strategy (только если есть настройки)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { providerId: profile.id, provider: 'google' },
            { email: profile.emails[0].value }
          ]
        }
      });

      if (user) {
        // Update existing user with Google info if needed
        if (!user.providerId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              provider: 'google',
              providerId: profile.id
            }
          });
        }
        
        logger.info(`Existing user logged in via Google: ${user.email}`);
        return done(null, user);
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          name: profile.displayName,
          provider: 'google',
          providerId: profile.id,
          isEmailVerified: true
        }
      });

      logger.info(`New user created via Google OAuth: ${user.email}`);
      return done(null, user);
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
  } else {
    logger.info('Google OAuth не настроен - пропускаем');
  }

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
