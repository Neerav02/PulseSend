import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { emailController } from '../controllers/email.controller';
import { senderController } from '../controllers/sender.controller';
import { slackController } from '../controllers/slack.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const apiRouter = Router();

// ==========================================
// Authentication Routes (Public / Guarded)
// ==========================================
apiRouter.get('/auth/google', (req, res) => authController.googleLogin(req, res));
apiRouter.get('/auth/google/callback', (req, res) => authController.googleCallback(req, res));
apiRouter.get('/auth/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));
apiRouter.post('/auth/logout', (req, res) => authController.logout(req, res));

// ==========================================
// Email Scheduling & Listing Routes (Guarded)
// ==========================================
apiRouter.post('/emails/schedule', authMiddleware, (req, res) => emailController.schedule(req, res));
apiRouter.get('/emails/scheduled', authMiddleware, (req, res) => emailController.getScheduled(req, res));
apiRouter.get('/emails/sent', authMiddleware, (req, res) => emailController.getSent(req, res));
apiRouter.get('/emails/search', authMiddleware, (req, res) => emailController.search(req, res));
apiRouter.get('/emails/:id', authMiddleware, (req, res) => emailController.getDetails(req, res));
apiRouter.delete('/emails/:id', authMiddleware, (req, res) => emailController.cancel(req, res));

// ==========================================
// Sender Mailbox Management Routes (Guarded)
// ==========================================
apiRouter.get('/senders', authMiddleware, (req, res) => senderController.list(req, res));
apiRouter.post('/senders', authMiddleware, (req, res) => senderController.create(req, res));
apiRouter.post('/senders/:id/test', authMiddleware, (req, res) => senderController.testConnection(req, res));

// ==========================================
// Slack Integration Routes (Guarded)
// ==========================================
apiRouter.get('/integrations/slack/connect', authMiddleware, (req, res) => slackController.connect(req, res));
apiRouter.get('/integrations/slack/callback', (req, res) => slackController.callback(req, res));
apiRouter.get('/integrations/slack/status', authMiddleware, (req, res) => slackController.getStatus(req, res));
apiRouter.post('/integrations/slack/test', authMiddleware, (req, res) => slackController.sendTestNotification(req, res));
apiRouter.delete('/integrations/slack', authMiddleware, (req, res) => slackController.disconnect(req, res));

// ==========================================
// Analytics & Dashboard Telemetry (Guarded)
// ==========================================
apiRouter.get('/analytics/dashboard', authMiddleware, (req, res) => analyticsController.getDashboardStats(req, res));

