// routes/auth.js — Authentication routes
//
// Endpoints:
//   POST /api/auth/login
//     Body:   { accessKeyId, secretAccessKey, region }
//     Action: Validate credentials via STS GetCallerIdentity,
//             sign a JWT on success, return { token }
//     Errors: 401 on invalid credentials, 500 on unexpected errors
//
// Dependencies:
//   - authService.validateCredentials(accessKeyId, secretAccessKey, region)
//       → resolves with caller identity or rejects on invalid creds
//   - jwt.sign() to produce the session token
//   - process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN

import { Router } from 'express';
// import jwt from 'jsonwebtoken';
// import { validateCredentials } from '../services/authService.js';

const router = Router();

// POST /api/auth/login
// TODO: implement
//   1. Destructure { accessKeyId, secretAccessKey, region } from req.body
//   2. Call validateCredentials — it should call STS and throw on bad creds
//   3. Sign a JWT containing { accessKeyId, region } and the caller ARN
//   4. Return { token }
router.post('/login', async (_req, res) => {
  // TODO
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
