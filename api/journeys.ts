import {
  getAllJourneys,
  addJourney,
  resetJourneys,
  clearJourneys,
  normalizeServerDestination,
  StoredJourney,
} from './lib/storage';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/journeys - Return all journeys sorted newest first
  if (req.method === 'GET') {
    try {
      const journeys = await getAllJourneys();
      return res.status(200).json(journeys);
    } catch (err) {
      console.error('[SEG API] Failed to fetch journeys:', err);
      return res.status(500).json({ error: 'Failed to retrieve journeys from database' });
    }
  }

  // POST /api/journeys - Ingress endpoint for NodeMCU ESP8266 or Simulator
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Malformed JSON payload' });
        }
      }

      // Check if reset action requested via query or body
      if (req.query?.action === 'reset' || body?.action === 'reset') {
        const resetData = await resetJourneys();
        return res.status(200).json({
          success: true,
          message: 'Database reset to default seed journeys',
          total: resetData.length,
        });
      }

      const rawDestination = body?.destination;
      const validatedDest = normalizeServerDestination(rawDestination);

      // Validate destination strictly: ONLY College, Gym, Trip
      if (!validatedDest) {
        return res.status(400).json({
          error: 'Invalid destination. Valid destinations are ONLY: College, Gym, Trip',
          received: rawDestination,
        });
      }

      // Save permanently to database with server-generated date, time, and timestamp
      const newJourney = await addJourney(validatedDest);

      console.log(
        `[SEG Ingress] Departure confirmed: ${newJourney.destination} at ${newJourney.date} ${newJourney.time} (ID: ${newJourney.id})`
      );

      // Return HTTP 201 Created
      return res.status(201).json(newJourney);
    } catch (err) {
      console.error('[SEG API] Failed to save journey:', err);
      return res.status(500).json({
        error: 'Failed to persist journey to database',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // DELETE /api/journeys - Clear journeys (for exhibition testing)
  if (req.method === 'DELETE') {
    try {
      await clearJourneys();
      return res.status(200).json({ success: true, message: 'All journeys cleared', total: 0 });
    } catch (err) {
      console.error('[SEG API] Failed to clear journeys:', err);
      return res.status(500).json({ error: 'Failed to clear database' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
