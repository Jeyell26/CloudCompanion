import express from 'express';
import cors from 'cors';


const app = express();

// server.js — LogPulse backend entry point
//
// Responsibilities:
//   - Boot Express with CORS and JSON body parsing
//   - Mount all feature routers under /api
//   - Start the HTTP server
//
// Port is read from the PORT environment variable (default 5000).
// See .env.example for all required environment variables.

import express from 'express';
import cors from 'cors';

// Route modules — each file registers its own router
import authRouter from './routes/auth.js';
import logGroupsRouter from './routes/logGroups.js';
import liveTailRouter from './routes/liveTail.js';
import rangeQueryRouter from './routes/rangeQuery.js';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// TODO: tighten origin in production (read CORS_ORIGIN from .env)
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRouter);
app.use('/api/log-groups', logGroupsRouter);
app.use('/api/live-tail', liveTailRouter);
app.use('/api/range-query', rangeQueryRouter);

// Health check — used by Docker / load balancer probes
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'logpulse-backend' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`[logpulse] server listening on port ${PORT}`);
});
