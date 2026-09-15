import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Destination, Journey } from '../types';
import { DESTINATION_CONFIGS, formatDisplayDate } from '../utils/destinations';

interface TravelHistoryTableProps {
  journeys: Journey[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onResetData: () => void;
  onClearAll: () => void;
  onOpenSimulator: () => void;
}

export const TravelHistoryTable: React.FC<TravelHistoryTableProps> = ({
  journeys,
  isLoading,
  errorMessage,
  onRefresh,
  onResetData,
  onClearAll,
  onOpenSimulator,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | Destination>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJourneys = useMemo(() => {
    return journeys.filter((journey) => {
      const matchesFilter =
        selectedFilter === 'All' || journey.destination === selectedFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        journey.destination.toLowerCase().includes(q) ||
        journey.date.toLowerCase().includes(q) ||
        journey.time.toLowerCase().includes(q) ||
        formatDisplayDate(journey.date).toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [journeys, selectedFilter, searchQuery]);

  return (
    <div
      id="section-travel-history"
      className="rounded-xl bg-[#22160f] border border-[#3d2719] p-5 sm:p-6 shadow-sm"
    >
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#362114]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#faf3e8] tracking-tight">
            TRAVEL HISTORY
          </h2>
          <p className="text-xs text-[#c8b39e] mt-0.5">
            Confirmed departure logs received from NodeMCU (newest first)
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9e8a78] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#1a110a] border border-[#382315] rounded-lg text-xs text-[#faf3e8] placeholder:text-[#8f7c6d] focus:outline-none focus:border-[#5c3c26] transition-all font-mono"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#1a110a] border border-[#382315] rounded-lg p-0.5 text-xs">
            {(['All', 'College', 'Gym', 'Trip'] as const).map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    isActive
                      ? 'bg-[#3d2719] text-[#faf3e8] font-medium border border-[#5a3a25]'
                      : 'text-[#9e8a78] hover:text-[#d4c2b0]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Quick Data Reset/Clear for Exhibition */}
          <button
            type="button"
            onClick={onResetData}
            title="Reset to default seed data"
            className="p-1.5 rounded-lg bg-[#2b1c13] hover:bg-[#382419] text-[#c8b39e] hover:text-[#faf3e8] border border-[#382315] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClearAll}
            title="Clear all logs"
            className="p-1.5 rounded-lg bg-[#2b1c13] hover:bg-[#382419] text-[#c8b39e] hover:text-[#f87171] border border-[#382315] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-[#3a1a12] border border-[#7a2e1d] text-[#fca5a5] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-2.5 py-1 rounded bg-[#5a2318] hover:bg-[#6e2b1e] text-[#faf3e8] font-medium text-xs transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Clean Table: DATE | TIME | DESTINATION */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#362114] text-[11px] font-mono uppercase tracking-wider text-[#c8b39e] bg-[#1a110a]">
              <th className="py-2.5 px-4 rounded-tl-lg font-medium">DATE</th>
              <th className="py-2.5 px-4 font-medium">TIME</th>
              <th className="py-2.5 px-4 rounded-tr-lg font-medium">DESTINATION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e1d13] text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-[#2b1c13] rounded w-28" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-[#2b1c13] rounded w-20" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-[#2b1c13] rounded w-24" />
                  </td>
                </tr>
              ))
            ) : filteredJourneys.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 px-4 text-center">
                  <p className="text-[#faf3e8] font-medium text-sm">
                    {journeys.length === 0
                      ? 'No journeys recorded yet'
                      : 'No journeys matching filter'}
                  </p>
                  <p className="text-[#9e8a78] text-xs mt-1">
                    When the physical NodeMCU finishes a departure, it will appear here automatically.
                  </p>
                  {journeys.length === 0 && (
                    <button
                      type="button"
                      onClick={onOpenSimulator}
                      className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#3d2719] hover:bg-[#4d3220] border border-[#5c3c26] text-[#faf3e8] text-xs font-medium transition-all"
                    >
                      Simulate NodeMCU Departure
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredJourneys.map((journey, index) => {
                const config = DESTINATION_CONFIGS[journey.destination];
                const isNewest = index === 0 && selectedFilter === 'All' && !searchQuery;

                return (
                  <tr
                    key={journey.id || `j-${index}`}
                    className={`hover:bg-[#281a11] transition-colors ${
                      isNewest ? 'bg-[#261910]' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-[#faf3e8] font-medium text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span>{formatDisplayDate(journey.date)}</span>
                        {isNewest && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3d2719] text-[#d97706] border border-[#5a3821]">
                            Newest
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-[#d4c2b0] font-mono text-xs">
                      {journey.time}
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.borderAccent}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{journey.destination}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Footer */}
      <div className="mt-3 pt-3 border-t border-[#362114] flex items-center justify-between text-xs text-[#9e8a78]">
        <span>Showing {filteredJourneys.length} of {journeys.length} journeys</span>
        <span>NodeMCU verified</span>
      </div>
    </div>
  );
};
