import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, clientOrigins, normalizeOrigin } from './config/env.js';
import { isAllowedBrowserOrigin } from './utils/origins.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

const app = express();

if (env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    // Helmet 8 defaults to script-src 'none', which blocks Vite/React if HTML is
    // ever served behind this API, and is useless on JSON responses.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Origin');
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      const requestOrigin = normalizeOrigin(origin);

      if (
        isAllowedBrowserOrigin(requestOrigin, {
          clientOrigins,
          rootDomain: env.ROOT_DOMAIN,
          nodeEnv: env.NODE_ENV,
        })
      ) {
        return callback(null, requestOrigin || true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
