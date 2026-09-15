import { resetJourneys } from '../lib/storage';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = await resetJourneys();
      return res.status(200).json({
        success: true,
        message: 'Database reset to default seed journeys',
        total: data.length,
      });
    } catch (err) {
      console.error('[SEG API] Reset failed:', err);
      return res.status(500).json({ error: 'Reset failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
