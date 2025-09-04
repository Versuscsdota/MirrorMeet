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

const app = express();
const PORT = process.env.PORT || 3001;

// Create necessary directories
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
