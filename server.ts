import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// API routes live in server/api.ts (shared with the Netlify Function in netlify/functions/api.mts).
// Bridge Express requests to the Web Request/Response handler.
app.use('/api', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0;
    const request = new Request(`http://${req.headers.host || 'localhost'}${req.originalUrl}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: hasBody ? req.body : undefined,
    });

    const response = await handleApiRequest(request);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Error handling API request:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    } else {
      res.end();
    }
  }
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Liky AI] Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
