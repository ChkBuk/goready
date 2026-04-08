import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validators.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const { email, password, name } = parsed.data;

    // Check if user exists
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        currency: users.currency,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          currency: user.currency,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        currency: users.currency,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId));

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const [user] = await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, req.user!.userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        currency: users.currency,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// GET /api/auth/google — redirect to Google OAuth
authRouter.get('/google', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.API_URL || 'http://localhost:4000'}/api/auth/google/callback`;

  if (!clientId) {
    res.status(500).json({ success: false, error: 'Google OAuth not configured' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /api/auth/google/callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code missing' });
      return;
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:4000'}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      res.status(400).json({ success: false, error: 'Failed to get access token' });
      return;
    }

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json() as {
      email: string;
      name: string;
      picture?: string;
    };

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture || null,
        })
        .returning();
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Redirect to frontend with tokens
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(
      `${clientUrl}/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ success: false, error: 'Google authentication failed' });
  }
});
