// middleware/auth.js — JWT verification middleware
//
// Attach this middleware to any route that requires an authenticated session.
//
// Expected request header:
//   Authorization: Bearer <jwt>
//
// On success:
//   - Decodes the token and attaches the payload to req.user
//   - Calls next() to continue the request lifecycle
//
// On failure:
//   - Returns HTTP 401 with a JSON error body
//
// The JWT secret is read from process.env.JWT_SECRET.
// Token verification uses the `jsonwebtoken` package.

import jwt from 'jsonwebtoken';

// TODO: implement verifyToken middleware
//   1. Read the Authorization header
//   2. Extract the Bearer token
//   3. Verify with jwt.verify(token, process.env.JWT_SECRET)
//   4. Attach decoded payload to req.user
//   5. Call next() on success, return 401 on any failure

export function verifyToken(req, res, next) {
  // TODO
}
