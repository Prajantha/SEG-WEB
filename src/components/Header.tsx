import React from 'react';
import { RefreshCw, Cpu, Database, Layers } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  latencyMs: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  isMockMode: boolean;
  onToggleMockMode: (enabled: boolean) => void;
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  latencyMs,
  isRefreshing,
  onRefresh,
  isMockMode,
  onToggleMockMode,
  onOpenSimulator,
}) => {
  return (
    <header className="w-full bg-[#1c130d] border-b border-[#382417] sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Simple Header Title & Subtitle */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#faf3e8]">
              SMART EXIT GUARDIAN
            </h1>
            <p className="text-xs sm:text-sm text-[#c8b39e] mt-0.5">
              &ldquo;Your Intelligent Departure Companion&rdquo;
            </p>
          </div>

          {/* Clean Controls & Status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            
            {/* System Status */}
            <div
              id="seg-system-status-badge"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#442c1c] bg-[#24170f] text-xs font-mono"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-[#faf3e8] font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {isOnline && latencyMs > 0 && (
                <span className="text-[#9e8a78] text-[11px]">
                  {latencyMs}ms
                </span>
              )}
            </div>

            {/* Mode Switcher: Live API vs Mock Data */}
            <div className="flex items-center bg-[#24170f] border border-[#442c1c] rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => onToggleMockMode(false)}
                title="Use real database / serverless API"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  !isMockMode
                    ? 'bg-[#3d2719] text-[#faf3e8] font-medium border border-[#5a3a25]'
                    : 'text-[#9e8a78] hover:text-[#d4c2b0]'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Live API</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleMockMode(true)}
                title="Use offline exhibition mock data"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  isMockMode
                    ? 'bg-[#3d2719] text-[#faf3e8] font-medium border border-[#5a3a25]'
                    : 'text-[#9e8a78] hover:text-[#d4c2b0]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#c26522]" />
                <span>Mock Data</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              id="seg-refresh-btn"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b1c13] hover:bg-[#382419] active:scale-95 border border-[#442c1c] text-[#faf3e8] text-xs font-medium transition-all"
              title="Refresh Journey History"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#d97706]' : 'text-[#c8b39e]'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* NodeMCU Test / Departure Simulation */}
            <button
              id="seg-nodemcu-trigger-btn"
              type="button"
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3d2719] hover:bg-[#4d3220] active:scale-95 border border-[#5c3c26] text-[#faf3e8] text-xs font-medium transition-all"
              title="Test NodeMCU Hardware Departures"
            >
              <Cpu className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Test NodeMCU</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
