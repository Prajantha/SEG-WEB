import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

export interface StoredJourney {
  id: string;
  date: string;
  time: string;
  destination: 'College' | 'Gym' | 'Trip';
  timestamp: number;
}

export const SEED_JOURNEYS: StoredJourney[] = [
  {
    id: 'seg-001',
    date: '2026-09-16',
    time: '08:15 AM',
    destination: 'College',
    timestamp: 1789546500000,
  },
  {
    id: 'seg-002',
    date: '2026-09-15',
    time: '05:40 PM',
    destination: 'Gym',
    timestamp: 1789494000000,
  },
  {
    id: 'seg-003',
    date: '2026-09-14',
    time: '07:20 AM',
    destination: 'Trip',
    timestamp: 1789370400000,
  },
  {
    id: 'seg-004',
    date: '2026-09-13',
    time: '08:30 AM',
    destination: 'College',
    timestamp: 1789288200000,
  },
  {
    id: 'seg-005',
    date: '2026-09-12',
    time: '06:10 PM',
    destination: 'Gym',
    timestamp: 1789236600000,
  },
  {
    id: 'seg-006',
    date: '2026-09-11',
    time: '08:10 AM',
    destination: 'College',
    timestamp: 1789114200000,
  },
  {
    id: 'seg-007',
    date: '2026-09-10',
    time: '08:25 AM',
    destination: 'College',
    timestamp: 1789028700000,
  },
  {
    id: 'seg-008',
    date: '2026-09-09',
    time: '08:15 AM',
    destination: 'College',
    timestamp: 1788941700000,
  },
];

const REDIS_KEY = 'seg_journeys_v1';

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (err) {
      console.error('[SEG Storage] Failed to initialize Upstash Redis client:', err);
      return null;
    }
  }
  return null;
}

function getLocalFilePath(): string {
  // If in Vercel serverless environment without Redis, use /tmp which is writable
  if (process.env.VERCEL) {
    return '/tmp/seg_journeys.json';
  }
  return path.join(process.cwd(), 'data', 'journeys.json');
}

function readLocalJourneys(): StoredJourney[] {
  const filePath = getLocalFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[SEG Storage] Error reading local file store, initializing seed:', err);
  }

  // Initialize with seed data
  writeLocalJourneys(SEED_JOURNEYS);
  return [...SEED_JOURNEYS];
}

function writeLocalJourneys(journeys: StoredJourney[]): void {
  const filePath = getLocalFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(journeys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SEG Storage] Failed to write local journeys file:', err);
  }
}

/**
 * Server-side timestamp generator
 * NodeMCU ESP8266 only provides destination - server creates date, time, and timestamp
 */
export function generateServerTimestamp(): { date: string; time: string; timestamp: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  return { date: dateStr, time: timeStr, timestamp: now.getTime() };
}

/**
 * Validates destination: ONLY 'College', 'Gym', 'Trip'
 */
export function normalizeServerDestination(dest: unknown): 'College' | 'Gym' | 'Trip' | null {
  if (typeof dest !== 'string') return null;
  const cleaned = dest.trim().toLowerCase();
  if (cleaned === 'college') return 'College';
  if (cleaned === 'gym') return 'Gym';
  if (cleaned === 'trip') return 'Trip';
  return null;
}

/**
 * Retrieve all journeys sorted newest first
 */
export async function getAllJourneys(): Promise<StoredJourney[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<StoredJourney[]>(REDIS_KEY);
      if (data && Array.isArray(data)) {
        return sortJourneysNewestFirst(data);
      }
      // Seed if empty in Redis
      await redis.set(REDIS_KEY, SEED_JOURNEYS);
      return sortJourneysNewestFirst(SEED_JOURNEYS);
    } catch (err) {
      console.error('[SEG Storage] Redis read error, falling back to local store:', err);
    }
  }

  const local = readLocalJourneys();
  return sortJourneysNewestFirst(local);
}

/**
 * Add a newly confirmed departure journey
 */
export async function addJourney(destination: 'College' | 'Gym' | 'Trip'): Promise<StoredJourney> {
  const { date, time, timestamp } = generateServerTimestamp();
  const newJourney: StoredJourney = {
    id: `seg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    date,
    time,
    destination,
    timestamp,
  };

  const redis = getRedisClient();
  if (redis) {
    try {
      let current = await redis.get<StoredJourney[]>(REDIS_KEY);
      if (!current || !Array.isArray(current)) {
        current = [...SEED_JOURNEYS];
      }
      current.unshift(newJourney);
      await redis.set(REDIS_KEY, current);
      return newJourney;
    } catch (err) {
      console.error('[SEG Storage] Redis write error, saving locally:', err);
    }
  }

  const current = readLocalJourneys();
  current.unshift(newJourney);
  writeLocalJourneys(current);
  return newJourney;
}

/**
 * Reset journeys to initial exhibition seed data
 */
export async function resetJourneys(): Promise<StoredJourney[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, SEED_JOURNEYS);
    } catch (err) {
      console.error('[SEG Storage] Redis reset error:', err);
    }
  }
  writeLocalJourneys(SEED_JOURNEYS);
  return [...SEED_JOURNEYS];
}

/**
 * Clear all journeys (for testing empty state)
 */
export async function clearJourneys(): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, []);
    } catch (err) {
      console.error('[SEG Storage] Redis clear error:', err);
    }
  }
  writeLocalJourneys([]);
}

function sortJourneysNewestFirst(list: StoredJourney[]): StoredJourney[] {
  return [...list].sort((a, b) => b.timestamp - a.timestamp);
}
