// routes/rangeQuery.js — Range query route
//
// Endpoints:
//   POST /api/range-query
//     Headers: Authorization: Bearer <jwt>
//     Body:    { groups: string[], range: { startDate, startTime, endDate, endTime }, nextToken? }
//     Action:  Run a CloudWatch Logs Insights query (or FilterLogEvents) for
//              the given groups and time window, returning one page of results.
//     Returns: { events: LogEvent[], nextToken?: string, totalPages?: number }
//     Errors:  400 on invalid range, 401 on bad token, 500 on AWS errors
//
// Pagination strategy:
//   The frontend calls this endpoint repeatedly, passing the nextToken from
//   the previous response until nextToken is absent.
//
// Time conversion:
//   The frontend sends ISO date strings (YYYY-MM-DD + HH:MM:SS).
//   Convert to epoch milliseconds before passing to AWS.
//
// Dependencies:
//   - verifyToken middleware
//   - rangeQueryService.queryRange(groups, startMs, endMs, nextToken, region, credentials)
//       → wraps FilterLogEvents or StartQuery + GetQueryResults

import { Router } from 'express';
// import { verifyToken } from '../middleware/auth.js';
// import { queryRange } from '../services/rangeQueryService.js';

const router = Router();

// POST /api/range-query
// TODO: implement
//   1. Apply verifyToken
//   2. Destructure { groups, range, nextToken } from req.body
//   3. Validate: end > start, range does not exceed maxTimeWindowHours
//   4. Convert range strings to epoch ms
//   5. Call queryRange — return { events, nextToken, totalPages }
//   6. Map AWS LogEvent fields to the frontend LogEvent shape
router.post('/', async (_req, res) => {
  // TODO
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
