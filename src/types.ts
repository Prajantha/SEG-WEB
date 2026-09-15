export type Destination = 'College' | 'Gym' | 'Trip';

export interface Journey {
  id: string;
  date: string;       // e.g. "2026-09-16" or "16 Sep 2026"
  time: string;       // e.g. "08:15 AM"
  destination: Destination;
  timestamp?: number; // epoch ms for sorting & relative time
}

export interface NewJourneyPayload {
  destination: Destination | string;
}

export interface DestinationStats {
  destination: Destination;
  count: number;
  percentage: number;
  color: string;
  bgGlow: string;
  borderColor: string;
  iconName: 'college' | 'gym' | 'trip';
  checklist: string[];
}

export interface DashboardMetrics {
  totalJourneys: number;
  mostVisited: {
    destination: Destination | 'None';
    count: number;
    percentage: number;
  };
  lastDestination: Destination | 'None';
  lastJourneyTime: {
    date: string;
    time: string;
    formatted: string;
    relative: string;
  } | null;
  breakdown: Record<Destination, number>;
}
