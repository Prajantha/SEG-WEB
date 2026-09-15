import { Journey, Destination, NewJourneyPayload } from '../types';
import { INITIAL_MOCK_JOURNEYS } from '../data/mockJourneys';

// Resolve base API URL from environment or default to relative path '/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

const MOCK_STORAGE_KEY = 'seg_mock_journeys_v1';
const DATA_MODE_KEY = 'seg_data_source_mode'; // 'live' | 'mock'

/**
 * Format helper for client-side mock fallback
 */
function getCurrentFormattedDateTime(): { date: string; time: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  return { date: dateStr, time: timeStr };
}

/**
 * Normalizes destination string into 'College' | 'Gym' | 'Trip'
 */
export function normalizeDestination(dest: string): Destination {
  const lower = dest.trim().toLowerCase();
  if (lower === 'college') return 'College';
  if (lower === 'gym') return 'Gym';
  if (lower === 'trip') return 'Trip';
  // Default fallback if unknown
  return 'College';
}

class TravelLogService {
  private isMockMode: boolean = false;

  constructor() {
    // Check if user previously toggled mock/live mode in browser
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem(DATA_MODE_KEY) : null;
    this.isMockMode = savedMode === 'mock';
  }

  public getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  public isUsingMockMode(): boolean {
    return this.isMockMode;
  }

  public setMockMode(enabled: boolean): void {
    this.isMockMode = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(DATA_MODE_KEY, enabled ? 'mock' : 'live');
    }
  }

  /**
   * Check backend health / connection status
   */
  public async checkHealth(): Promise<{ online: boolean; message: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) {
        return { online: true, message: 'NodeMCU Ingress Ready', latencyMs };
      }
      return { online: false, message: `Status code ${response.status}`, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        online: false,
        message: err instanceof Error ? err.message : 'Backend unreachable',
        latencyMs,
      };
    }
  }

  /**
   * Fetch journeys from the backend API or mock store
   */
  public async getJourneys(): Promise<Journey[]> {
    if (this.isMockMode) {
      return this.getLocalMockJourneys();
    }

    const response = await fetch(`${API_BASE_URL}/journeys`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from /api/journeys');
    }

    // Sort with newest journeys first
    return this.sortJourneysNewestFirst(data);
  }

  /**
   * Record a new journey (simulates what NodeMCU does via HTTP POST)
   * In Live Mode: strictly saves to database. Never silently writes to localStorage on failure.
   */
  public async recordJourney(destination: Destination | string): Promise<Journey> {
    const normalizedDest = normalizeDestination(destination);
    const payload: NewJourneyPayload = { destination: normalizedDest };

    if (this.isMockMode) {
      return this.addLocalMockJourney(normalizedDest);
    }

    const response = await fetch(`${API_BASE_URL}/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.error) errorDetail = errorJson.error;
      } catch {
        // use status
      }
      throw new Error(`Database error recording journey: ${errorDetail}`);
    }

    const created: Journey = await response.json();
    return created;
  }

  /**
   * Resets data to initial sample state
   */
  public async resetData(): Promise<void> {
    if (this.isMockMode) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_JOURNEYS));
      return;
    }

    const response = await fetch(`${API_BASE_URL}/journeys/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      throw new Error('Reset failed on server/database');
    }
  }

  /**
   * Clears all recorded journeys (for demonstrating zero-state in exhibition)
   */
  public async clearAll(): Promise<void> {
    if (this.isMockMode) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([]));
      return;
    }

    const response = await fetch(`${API_BASE_URL}/journeys`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      throw new Error('Failed to clear journeys on server/database');
    }
  }

  // --- Local mock storage handlers ---
  private getLocalMockJourneys(): Journey[] {
    if (typeof window === 'undefined') return INITIAL_MOCK_JOURNEYS;
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_JOURNEYS));
      return INITIAL_MOCK_JOURNEYS;
    }
    try {
      const parsed = JSON.parse(stored);
      return this.sortJourneysNewestFirst(parsed);
    } catch {
      return INITIAL_MOCK_JOURNEYS;
    }
  }

  private addLocalMockJourney(destination: Destination): Journey {
    const { date, time } = getCurrentFormattedDateTime();
    const newJourney: Journey = {
      id: `seg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      time,
      destination,
      timestamp: Date.now(),
    };

    const current = this.getLocalMockJourneys();
    const updated = [newJourney, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updated));
    }
    return newJourney;
  }

  private sortJourneysNewestFirst(journeys: Journey[]): Journey[] {
    return [...journeys].sort((a, b) => {
      const timeA = a.timestamp || new Date(`${a.date} ${a.time}`).getTime() || 0;
      const timeB = b.timestamp || new Date(`${b.date} ${b.time}`).getTime() || 0;
      return timeB - timeA;
    });
  }
}

export const travelLogService = new TravelLogService();
