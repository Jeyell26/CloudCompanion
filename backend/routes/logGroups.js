// routes/logGroups.js — Log group listing route
//
// Endpoints:
//   GET /api/log-groups
//     Headers: Authorization: Bearer <jwt>
//     Action:  Fetch all CloudWatch log groups visible to the IAM principal
//              encoded in the JWT.
//     Returns: LogGroup[]
//       [{ name, arn, storedBytes, retentionDays }, ...]
//     Errors:  401 if token missing/invalid, 500 on AWS errors
//
// Dependencies:
//   - verifyToken middleware (middleware/auth.js)
//   - logGroupsService.listLogGroups(region, credentials)
//       → wraps CloudWatch Logs DescribeLogGroups (paginated)

import { Router } from 'express';
// import { verifyToken } from '../middleware/auth.js';
// import { listLogGroups } from '../services/logGroupsService.js';

const router = Router();

// GET /api/log-groups
// TODO: implement
//   1. Apply verifyToken middleware
//   2. Extract region and credentials from req.user (JWT payload)
//   3. Call listLogGroups — handle CloudWatch pagination internally in the service
//   4. Map the AWS response to the LogGroup shape expected by the frontend
//   5. Return the array as JSON
router.get('/', async (_req, res) => {
  // TODO
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
