import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import registerRoute from './routes/registerRoute.js';
import verifyRoute from './routes/verifyRoute.js';
import validateRoute from './routes/validateRoute.js';
import loginRoute from './routes/loginRoute.js';
import teamsRouter from './routes/teams.js';
import todoRouter from './routes/todo.js'
import searchRouter from './routes/search.js'
import prioritiesRouter from './routes/priorities.js';
import statusesRouter from './routes/statuses.js';
import { authenticateToken } from './middlewares/auth.js';
import { createUserRoutes } from './routes/userRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

app.use(express.json({ limit: '10mb' }));

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], 
    imgSrc: ["'self'", "data:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  },
}));

app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

app.use(helmet.ieNoOpen());

app.use(helmet.hidePoweredBy());

app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/verify', authLimiter);
app.use("/api/users", authenticateToken, createUserRoutes());
app.use("/api/search", searchRouter);
app.use('/api/todos', authenticateToken, todoRouter);
app.use('/api/teams', authenticateToken, teamsRouter);
app.use('/api/priorities', prioritiesRouter);
app.use('/api/statuses', statusesRouter);

app.use('/api', registerRoute);
app.use('/api', verifyRoute);
app.use('/api', validateRoute);
app.use('/api', loginRoute);

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


app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled error:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  res.status(500).json({ message });
});


const port: number = parseInt(process.env.PORT || '8080', 10);
app.listen(port, (): void => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
