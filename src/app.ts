import path from 'node:path';
import express from 'express';
import exportRoutes from './routes/exportRoutes';
import { initializeSchema } from './db/init';

initializeSchema();

const app = express();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'src', 'public')));
app.use('/api', exportRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default app;
