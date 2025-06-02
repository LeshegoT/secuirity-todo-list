import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import registerRoute from './routes/registerRoute';
import verifyRoute from './routes/verifyRoute';
import validateRoute from './routes/validateRoute';
import loginRoute from './routes/loginRoute';

const app = express();

app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

app.get('/api', (_req, res) => {
  res.json({ message: 'Welcome to the 2FA API' });
});

app.use('/api', registerRoute);
app.use('/api', verifyRoute);
app.use('/api', validateRoute);
app.use('/api', loginRoute);

const port = parseInt(process.env.PORT || '9000', 10);
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
