import React from 'react';
import {
  Activity,
  Award,
  Clock,
  Navigation,
  GraduationCap,
  Dumbbell,
  Compass,
  Calendar,
} from 'lucide-react';
import { DashboardMetrics, Destination } from '../types';
import { DESTINATION_CONFIGS, formatDisplayDate } from '../utils/destinations';

interface SummaryCardsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

function getDestinationIcon(destination: Destination | 'None', className = 'w-5 h-5') {
  switch (destination) {
    case 'College':
      return <GraduationCap className={className} />;
    case 'Gym':
      return <Dumbbell className={className} />;
    case 'Trip':
      return <Compass className={className} />;
    default:
      return <Navigation className={className} />;
  }
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics, isLoading }) => {
  const { totalJourneys, mostVisited, lastDestination, lastJourneyTime } = metrics;

  const mostVisitedConfig =
    mostVisited.destination !== 'None' ? DESTINATION_CONFIGS[mostVisited.destination] : null;

  const lastDestConfig =
    lastDestination !== 'None' ? DESTINATION_CONFIGS[lastDestination] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. TOTAL JOURNEYS */}
      <div
        id="card-total-journeys"
        className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300 group"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            TOTAL JOURNEYS
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Chakra_Petch',sans-serif] tracking-tight">
            {isLoading ? '...' : totalJourneys}
          </span>
          <span className="text-xs text-slate-400 font-mono">confirmed exits</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            NodeMCU Departures
          </span>
          <span className="font-mono text-[11px] text-slate-500">Hardware synced</span>
        </div>
      </div>

      {/* 2. MOST VISITED */}
      <div
        id="card-most-visited"
        className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300 group"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            MOST VISITED
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mostVisited.destination !== 'None' ? (
            <>
              <div
                className={`p-2.5 rounded-xl border ${mostVisitedConfig?.borderAccent} ${mostVisitedConfig?.badgeBg} ${mostVisitedConfig?.badgeText}`}
              >
                {getDestinationIcon(mostVisited.destination, 'w-5 h-5')}
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {mostVisited.destination}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {mostVisited.count} {mostVisited.count === 1 ? 'journey' : 'journeys'} ({mostVisited.percentage}%)
                </div>
              </div>
            </>
          ) : (
            <div className="text-lg font-medium text-slate-500">
              No data recorded
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Top Destination
          </span>
          <span className="font-mono text-[11px] text-slate-500">Auto-calculated</span>
        </div>
      </div>

      {/* 3. LAST DESTINATION */}
      <div
        id="card-last-destination"
        className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md hover:border-purple-500/40 transition-all duration-300 group"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            LAST DESTINATION
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Navigation className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastDestination !== 'None' ? (
            <>
              <div
                className={`p-2.5 rounded-xl border ${lastDestConfig?.borderAccent} ${lastDestConfig?.badgeBg} ${lastDestConfig?.badgeText}`}
              >
                {getDestinationIcon(lastDestination, 'w-5 h-5')}
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {lastDestination}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Final confirmed exit
                </div>
              </div>
            </>
          ) : (
            <div className="text-lg font-medium text-slate-500">
              Awaiting departure
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Recent Exit
          </span>
          <span className="font-mono text-[11px] text-slate-500">Verified log</span>
        </div>
      </div>

      {/* 4. LAST JOURNEY */}
      <div
        id="card-last-journey"
        className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md hover:border-blue-500/40 transition-all duration-300 group"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            LAST JOURNEY
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {lastJourneyTime ? (
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{formatDisplayDate(lastJourneyTime.date)}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-slate-300 font-mono text-sm">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lastJourneyTime.time}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {lastJourneyTime.relative}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-base text-slate-500 py-1">
            No departure recorded yet
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Server Timestamp
          </span>
          <span className="font-mono text-[11px] text-slate-500">Auto-stamped</span>
        </div>
      </div>

    </div>
  );
};
