import './env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { tripsRouter } from './routes/trips.js';
import { itineraryRouter } from './routes/itinerary.js';
import { bookingsRouter } from './routes/bookings.js';
import { expensesRouter } from './routes/expenses.js';
import { uploadRouter } from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/trips', itineraryRouter);
app.use('/api/trips', bookingsRouter);
app.use('/api/trips', expensesRouter);
app.use('/api/upload', uploadRouter);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  }
);

app.listen(PORT, () => {
  console.log(`GoReady API running on http://localhost:${PORT}`);
});

export default app;
