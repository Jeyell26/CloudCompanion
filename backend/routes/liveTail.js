// routes/liveTail.js — Live tail SSE route
//
// Endpoints:
//   GET /api/live-tail?groups[]=<group>&token=<jwt>
//     Protocol: Server-Sent Events (text/event-stream)
//     Query:    groups[] — one or more log group names
//               token    — JWT passed as query param because EventSource
//                          cannot set custom headers in the browser
//     Action:   Open a CloudWatch Logs StartLiveTail stream and forward
//               each LogEvent as an SSE `data:` frame to the client.
//     Teardown: When the client disconnects (req 'close' event), cancel
//               the AWS stream to avoid resource leaks.
//
// Notes:
//   - Disable response buffering: set headers before streaming.
//   - Keep-alive: send a comment line (": ping\n\n") every ~15s to prevent
//     proxy/load balancer timeouts.
//
// Dependencies:
//   - verifyToken (inline check against query.token, not Authorization header)
//   - liveTailService.startLiveTail(groups, region, credentials, onEvent)
//       → calls AWS StartLiveTail and invokes onEvent(LogEvent) for each chunk

import { Router } from 'express';
// import jwt from 'jsonwebtoken';
// import { startLiveTail } from '../services/liveTailService.js';

const router = Router();

// GET /api/live-tail
// TODO: implement
//   1. Verify JWT from query.token (EventSource cannot send Auth headers)
//   2. Set SSE response headers (Content-Type, Cache-Control, Connection)
//   3. Extract groups[] from query params
//   4. Call startLiveTail; in onEvent write: `data: ${JSON.stringify(event)}\n\n`
//   5. On req 'close': call the cleanup function returned by startLiveTail
//   6. Send a keepalive comment every 15s so proxies don't drop the connection
router.get('/', async (_req, res) => {
  // TODO
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
