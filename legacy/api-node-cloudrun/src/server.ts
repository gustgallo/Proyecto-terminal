import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { env } from './config/env.js';
import { pool, verifyDatabaseConnection } from './config/db.js';

const app = express();
const allowAllOrigins = env.CORS_ORIGINS.includes('*');

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllOrigins || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    system: 'PRODISA SWGRHP-IG API',
    database: 'MySQL',
    environment: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

app.get('/health/db', async (_req, res) => {
  try {
    await verifyDatabaseConnection();
    res.json({ status: 'OK', database: 'MySQL', connected: true });
  } catch (error) {
    console.error('Health check MySQL falló:', error);
    res.status(503).json({ status: 'ERROR', database: 'MySQL', connected: false });
  }
});

app.use('/api/v1', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

let server: ReturnType<typeof app.listen> | undefined;

const start = async () => {
  server = app.listen(env.PORT, '0.0.0.0', async () => {
    console.log(`Servidor Backend PRODISA activo en 0.0.0.0:${env.PORT}`);

    try {
      await verifyDatabaseConnection();
    } catch (error) {
      // En Cloud Run mantenemos el contenedor activo para poder diagnosticar
      // la configuración de Remote MySQL mediante /health/db.
      console.error('La API inició, pero MySQL todavía no está disponible:', error);
    }
  });
};

const shutdown = async () => {
  if (server) {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  } else {
    await pool.end();
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

void start();
