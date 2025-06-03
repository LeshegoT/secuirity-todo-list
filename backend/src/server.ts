import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import registerRoute from './routes/registerRoute.js';
import verifyRoute from './routes/verifyRoute.js';
import validateRoute from './routes/validateRoute.js';
import loginRoute from './routes/loginRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Basic security
app.use(express.json({ limit: '10mb' }));
app.use(helmet());

// Trust proxy for Elastic Beanstalk
app.set('trust proxy', 1);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static files (React build)
app.use(express.static(path.join(__dirname, 'build')));


// API Routes
app.use('/api', apiLimiter);
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/verify', authLimiter);

// Health check
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (_req: Request, res: Response): void => {
  res.json({ message: 'Welcome to the 2FA API' });
});

// Mount routes
app.use('/api', registerRoute);
app.use('/api', verifyRoute);
app.use('/api', validateRoute);
app.use('/api', loginRoute);

// Catch-all handler for React routing
app.get('*', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled error:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  res.status(500).json({ message });
});

// Use Elastic Beanstalk's PORT
const port: number = parseInt(process.env.PORT || '8080', 10);
app.listen(port, (): void => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
