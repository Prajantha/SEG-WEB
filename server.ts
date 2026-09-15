import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getAllJourneys,
  addJourney,
  resetJourneys,
  clearJourneys,
  normalizeServerDestination,
  StoredJourney,
} from './api/lib/storage';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser & CORS
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API Routes ---

  // Health check endpoint for NodeMCU and Frontend
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const journeys = await getAllJourneys();
      res.json({
        status: 'ok',
        device: 'Smart Exit Guardian Ingress Server',
        protocol: 'HTTP/1.1 REST',
        targetHardware: 'NodeMCU ESP8266',
        totalJourneys: journeys.length,
        timestamp: Date.now(),
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: 'Database health check failed' });
    }
  });

  // GET /api/journeys - Returns all journeys, sorted newest first
  app.get('/api/journeys', async (req: Request, res: Response) => {
    try {
      const sorted = await getAllJourneys();
      res.json(sorted);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve journeys from persistent database' });
    }
  });

  // POST /api/journeys - NodeMCU endpoint sending { "destination": "Gym" }
  app.post('/api/journeys', async (req: Request, res: Response) => {
    try {
      const { destination } = req.body || {};

      const validatedDest = normalizeServerDestination(destination);
      if (!validatedDest) {
        return res.status(400).json({
          error: 'Invalid destination. Valid destinations are ONLY: College, Gym, Trip',
          received: destination,
        });
      }

      const newJourney = await addJourney(validatedDest);

      console.log(
        `[SEG NodeMCU Ingress] Recorded Journey: ${newJourney.destination} at ${newJourney.date} ${newJourney.time} (ID: ${newJourney.id})`
      );

      res.status(201).json(newJourney);
    } catch (err) {
      console.error('[SEG Server] Failed to record journey:', err);
      res.status(500).json({ error: 'Failed to record journey to persistent database' });
    }
  });

  // POST /api/journeys/reset - Resets to initial exhibition mock journeys
  app.post('/api/journeys/reset', async (req: Request, res: Response) => {
    try {
      const data = await resetJourneys();
      res.json({ success: true, message: 'Database reset to default seed journeys', total: data.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset journeys' });
    }
  });

  // DELETE /api/journeys - Clears all journeys (for testing empty state)
  app.delete('/api/journeys', async (req: Request, res: Response) => {
    try {
      await clearJourneys();
      res.json({ success: true, message: 'All journeys cleared', total: 0 });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear journeys' });
    }
  });

  // --- Vite Dev or Static Production Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Exit Guardian Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
