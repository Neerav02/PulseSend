import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * Redirect to Google OAuth consent screen
   */
  async googleLogin(req: Request, res: Response) {
    if (!env.GOOGLE_CLIENT_ID) {
      // Mock dev login when Google credentials are not yet supplied
      logger.info('Google OAuth credentials not configured in .env. Signing in as default demo user.');

      let user = await prisma.user.findFirst();
      if (user) {
        const sessionToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            role: user.role,
          },
          env.SESSION_SECRET,
          { expiresIn: '7d' }
        );

        res.cookie('pulsesend_session', sessionToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.redirect(`${env.FRONTEND_URL}/dashboard?dev=true`);
    }

    const state = Math.random().toString(36).substring(7);
    const scope = ['openid', 'email', 'profile'].join(' ');
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(env.GOOGLE_CALLBACK_URL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `access_type=offline&prompt=consent`;

    res.redirect(url);
  }

  /**
   * Google OAuth Callback
   */
  async googleCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID || '',
          client_secret: env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = (await tokenRes.json()) as any;
      if (!tokenData.id_token) {
        throw new Error('Google token exchange failed');
      }

      // Fetch user profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = (await userRes.json()) as any;

      // Upsert User & Tenant
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        const tenant = await prisma.tenant.create({
          data: { name: `${googleUser.name}'s Workspace` },
        });

        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            googleId: googleUser.id,
            role: 'OWNER',
            tenantId: tenant.id,
          },
        });
      }

      if (!user) {
        throw new Error('Failed to create or find authenticated user');
      }

      // Sign JWT session token
      const sessionToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          tenantId: user.tenantId,
          role: user.role,
        },
        env.SESSION_SECRET,
        { expiresIn: '7d' }
      );

      // Set HttpOnly, Secure, SameSite=Lax cookie
      res.cookie('pulsesend_session', sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      logger.error({ error }, 'Google OAuth Callback Error');
      res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  /**
   * Get Current Authenticated User Session
   */
  async getCurrentUser(req: Request, res: Response) {
    res.json({
      success: true,
      data: req.user,
    });
  }

  /**
   * Logout User
   */
  async logout(req: Request, res: Response) {
    res.clearCookie('pulsesend_session');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export const authController = new AuthController();
