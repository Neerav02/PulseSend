import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  tenantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check HTTP-only cookie first
    let token = req.cookies?.pulsesend_session;

    // 2. Check Authorization Bearer header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 3. Fallback dev mode if no credentials configured yet
    if (!token && (!env.GOOGLE_CLIENT_ID || env.NODE_ENV === 'development')) {
      // Find or create default demo tenant & user for smooth local inspection
      let tenant = await prisma.tenant.findFirst({
        where: { name: 'Outbox Labs Demo Workspace' },
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { name: 'Outbox Labs Demo Workspace' },
        });
      }

      let user = await prisma.user.findFirst({
        where: { tenantId: tenant.id },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'neerav@pulsesend.io',
            name: 'Neerav Babel',
            avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Neerav+Babel',
            role: 'OWNER',
            tenantId: tenant.id,
          },
        });
      }

      if (!user) {
        throw new Error('Default dev user initialization failed');
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        role: user.role,
      };
      req.tenantId = user.tenantId;
      return next();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing authentication session',
      });
    }

    const decoded = jwt.verify(token, env.SESSION_SECRET) as AuthenticatedUser;

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User account no longer exists',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      role: user.role,
    };
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    logger.warn({ error }, 'Authentication verification failed');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired session',
    });
  }
}
