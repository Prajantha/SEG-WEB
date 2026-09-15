import { Destination, Journey, DashboardMetrics, DestinationStats } from '../types';

export const DESTINATION_CONFIGS: Record<
  Destination,
  {
    name: Destination;
    color: string;
    darkColor: string;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
    checklist: string[];
  }
> = {
  College: {
    name: 'College',
    color: '#d97706', // Warm golden caramel
    darkColor: '#b45309',
    badgeBg: 'bg-[#2e1d13]',
    badgeText: 'text-[#fcd34d]',
    borderAccent: 'border-[#784617]',
    checklist: [
      'Student ID Card & Transit Card',
      'Laptop, Charger & USB Drive',
      'Course Notebooks & Project Folder',
      'Headphones & Lab Access Key',
    ],
  },
  Gym: {
    name: 'Gym',
    color: '#c26522', // Cinnamon / Terracotta brown
    darkColor: '#9c4c1a',
    badgeBg: 'bg-[#2a170d]',
    badgeText: 'text-[#fdba74]',
    borderAccent: 'border-[#823c14]',
    checklist: [
      'Gym Pass & Locker Padlock',
      'Hydration Bottle (1.0 L)',
      'Workout Towel & Sweatband',
      'Training Shoes & Protein Shaker',
    ],
  },
  Trip: {
    name: 'Trip',
    color: '#9a6237', // Coffee / Mocha brown
    darkColor: '#7a4b27',
    badgeBg: 'bg-[#241811]',
    badgeText: 'text-[#f5d0b1]',
    borderAccent: 'border-[#663e20]',
    checklist: [
      'Tickets, Boarding Pass & ID',
      'Power Bank & Universal Cable',
      'Travel Wallet & Emergency Cash',
      'Weather Gear / Compact Umbrella',
    ],
  },
};

/**
 * Calculates dashboard metrics and breakdown dynamically from journey logs
 */
export function calculateMetrics(journeys: Journey[]): DashboardMetrics {
  const counts: Record<Destination, number> = {
    College: 0,
    Gym: 0,
    Trip: 0,
  };

  journeys.forEach((j) => {
    if (counts[j.destination] !== undefined) {
      counts[j.destination]++;
    }
  });

  const total = journeys.length;

  // Find most visited
  let mostVisitedDest: Destination | 'None' = 'None';
  let maxCount = -1;

  (['College', 'Gym', 'Trip'] as Destination[]).forEach((dest) => {
    if (counts[dest] > maxCount) {
      maxCount = counts[dest];
      mostVisitedDest = dest;
    }
  });

  if (total === 0 || maxCount === 0) {
    mostVisitedDest = 'None';
  }

  const mostVisitedPercentage =
    total > 0 && maxCount > 0 ? Math.round((maxCount / total) * 100) : 0;

  // Last destination & last journey date/time
  const latestJourney = journeys.length > 0 ? journeys[0] : null;

  let lastJourneyTime = null;
  if (latestJourney) {
    const formatted = `${latestJourney.date} • ${latestJourney.time}`;
    let relative = 'Recently';
    if (latestJourney.timestamp) {
      const diffMinutes = Math.floor((Date.now() - latestJourney.timestamp) / (1000 * 60));
      if (diffMinutes < 1) relative = 'Just now';
      else if (diffMinutes < 60) relative = `${diffMinutes}m ago`;
      else if (diffMinutes < 1440) relative = `${Math.floor(diffMinutes / 60)}h ago`;
      else relative = `${Math.floor(diffMinutes / 1440)}d ago`;
    }

    lastJourneyTime = {
      date: latestJourney.date,
      time: latestJourney.time,
      formatted,
      relative,
    };
  }

  return {
    totalJourneys: total,
    mostVisited: {
      destination: mostVisitedDest,
      count: maxCount > 0 ? maxCount : 0,
      percentage: mostVisitedPercentage,
    },
    lastDestination: latestJourney ? latestJourney.destination : 'None',
    lastJourneyTime,
    breakdown: counts,
  };
}

/**
 * Format a date string to friendly display if possible (e.g., "2026-09-16" -> "16 Sep 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  // If already in "16 Sep 2026" format, return as is
  if (/[a-zA-Z]/.test(dateStr)) return dateStr;

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    if (!isNaN(day) && monthNames[monthIndex]) {
      return `${String(day).padStart(2, '0')} ${monthNames[monthIndex]} ${year}`;
    }
  }
  return dateStr;
}
