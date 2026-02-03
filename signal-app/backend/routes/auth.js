import { Router } from 'express';
import { generateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

// In-memory user store (replace with DB in production)
const users = new Map();
const pendingAuth = new Map();

// X/Twitter OAuth - Step 1: Initiate
authRouter.get('/twitter', (req, res) => {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const callbackUrl = process.env.TWITTER_CALLBACK_URL;
  
  if (clientId === 'placeholder') {
    // Demo mode - return mock auth
    return res.json({
      demo: true,
      message: 'X OAuth not configured. Use /auth/demo for testing.',
      configureAt: 'https://developer.twitter.com'
    });
  }

  const state = uuidv4();
  const codeChallenge = uuidv4(); // Simplified PKCE
  
  pendingAuth.set(state, { 
    codeChallenge,
    createdAt: Date.now() 
  });

  // Clean old pending auths
  setTimeout(() => pendingAuth.delete(state), 600000);

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'plain');

  res.json({ authUrl: authUrl.toString() });
});

// X/Twitter OAuth - Step 2: Callback
authRouter.get('/twitter/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!pendingAuth.has(state)) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  const { codeChallenge } = pendingAuth.get(state);
  pendingAuth.delete(state);

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_CALLBACK_URL,
        code_verifier: codeChallenge
      })
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    const { data: twitterUser } = await userRes.json();

    // Create/update user
    let user = users.get(twitterUser.id);
    if (!user) {
      user = {
        id: twitterUser.id,
        username: twitterUser.username,
        avatar: twitterUser.profile_image_url,
        createdAt: new Date().toISOString()
      };
      users.set(twitterUser.id, user);
    }

    const jwt = generateToken(user);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwt}`);

  } catch (err) {
    console.error('[AUTH ERROR]', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
});

// Demo login (for development without X OAuth)
authRouter.post('/demo', (req, res) => {
  const demoUser = {
    id: 'demo_' + uuidv4().slice(0, 8),
    username: 'demo_user',
    avatar: '⚡',
    createdAt: new Date().toISOString()
  };

  users.set(demoUser.id, demoUser);
  const token = generateToken(demoUser);

  res.json({ token, user: demoUser });
});

// Get current user
authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout (client-side token removal, but track on server)
authRouter.post('/logout', (req, res) => {
  res.json({ success: true });
});
