import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/database';
import authRoutes from './routes/auth';
import modelsRouter from './routes/models';
import slotsRouter from './routes/slots';
import shiftsRouter from './routes/shifts';
import exportRouter from './routes/export';
import analyticsRouter from './routes/analytics';
import auditRouter from './routes/audit';
import usersRouter from './routes/users';
import rolesRouter from './routes/roles';
import addressesRouter from './routes/addresses';

const app = express();
const PORT = process.env.PORT || 3001;

// Create necessary directories using env-configurable paths
const DEFAULT_DATA_DIR = path.resolve('/var/lib/mirrorcrm');
const DEFAULT_UPLOADS_DIR = path.resolve('/var/lib/mirrorcrm/uploads');
const DEFAULT_EXPORTS_DIR = path.resolve('/var/lib/mirrorcrm/exports');

const dataDir = (process.env.DATA_DIR && process.env.DATA_DIR.trim().length > 0)
  ? process.env.DATA_DIR
  : DEFAULT_DATA_DIR;
const uploadsDir = (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0)
  ? process.env.UPLOADS_DIR
  : DEFAULT_UPLOADS_DIR;
const exportsDir = (process.env.EXPORTS_DIR && process.env.EXPORTS_DIR.trim().length > 0)
  ? process.env.EXPORTS_DIR
  : DEFAULT_EXPORTS_DIR;

[uploadsDir, dataDir, exportsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/export', exportRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/addresses', addressesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Default credentials - Username: root, Password: admin123`);
  console.log(`Analytics API available at: http://localhost:${PORT}/api/analytics/dashboard`);
});
