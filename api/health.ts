import type { IncomingMessage, ServerResponse } from 'http';
import { getAllJourneys } from './lib/storage';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const journeys = await getAllJourneys();
      return res.status(200).json({
        status: 'ok',
        device: 'Smart Exit Guardian Ingress Server',
        protocol: 'HTTP/1.1 REST',
        targetHardware: 'NodeMCU ESP8266',
        totalJourneys: journeys.length,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[SEG API] /api/health error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while checking system health',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
