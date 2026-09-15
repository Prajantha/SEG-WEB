import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DestinationFrequencyChart } from './components/DestinationFrequencyChart';
import { TravelHistoryTable } from './components/TravelHistoryTable';
import { NodeMcuSimulatorModal } from './components/NodeMcuSimulatorModal';
import { travelLogService } from './services/travelLogService';
import { Destination, Journey } from './types';
import { calculateMetrics } from './utils/destinations';

export default function App() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [isMockMode, setIsMockMode] = useState<boolean>(travelLogService.isUsingMockMode());
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const isPollingRef = useRef<boolean>(false);

  // Health and connectivity check
  const checkConnection = useCallback(async () => {
    const health = await travelLogService.checkHealth();
    setIsOnline(health.online);
    setLatencyMs(health.latencyMs);
  }, []);

  // Fetch journeys from API
  const loadJourneys = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) setIsLoading(true);
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data = await travelLogService.getJourneys();
      setJourneys(data);
      await checkConnection();
    } catch (err) {
      console.error('Failed to load journeys:', err);
      setErrorMessage(
        err instanceof Error
          ? `Backend Error: ${err.message}`
          : 'Unable to communicate with the journey server'
      );
      setIsOnline(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkConnection]);

  // Initial load
  useEffect(() => {
    loadJourneys(true);
  }, [loadJourneys]);

  // Real-time polling every 4 seconds to capture fresh NodeMCU POST departures instantly
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const data = await travelLogService.getJourneys();
        setJourneys(data);
        const health = await travelLogService.checkHealth();
        setIsOnline(health.online);
        setLatencyMs(health.latencyMs);
      } catch (err) {
        console.warn('Silent polling update error:', err);
      } finally {
        isPollingRef.current = false;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle Recording New Journey (from Simulator or Ingress)
  const handleRecordJourney = async (destination: Destination) => {
    try {
      await travelLogService.recordJourney(destination);
      await loadJourneys(false);
    } catch (err) {
      console.error('Error recording journey:', err);
      throw err;
    }
  };

  // Reset demo data
  const handleResetData = async () => {
    await travelLogService.resetData();
    await loadJourneys(true);
  };

  // Clear all data (for testing empty state)
  const handleClearAll = async () => {
    await travelLogService.clearAll();
    await loadJourneys(false);
  };

  // Switch between Live API and Mock Mode
  const handleToggleMockMode = (enabled: boolean) => {
    travelLogService.setMockMode(enabled);
    setIsMockMode(enabled);
    loadJourneys(true);
  };

  // Computed metrics from real backend data
  const metrics = calculateMetrics(journeys);

  return (
    <div className="min-h-screen bg-[#140d09] text-[#faf3e8] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. Header: SMART EXIT GUARDIAN / "Your Intelligent Departure Companion" */}
      <Header
        isOnline={isOnline}
        latencyMs={latencyMs}
        isRefreshing={isRefreshing}
        onRefresh={() => loadJourneys(false)}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Content: Destination Frequency & Travel History */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* 2. DESTINATION FREQUENCY SECTION */}
        <section id="section-frequency" aria-label="Destination Frequency">
          <DestinationFrequencyChart
            breakdown={metrics.breakdown}
            totalJourneys={metrics.totalJourneys}
          />
        </section>

        {/* 3. TRAVEL HISTORY SECTION */}
        <section id="section-travel-history-wrapper" aria-label="Travel History">
          <TravelHistoryTable
            journeys={journeys}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRefresh={() => loadJourneys(false)}
            onResetData={handleResetData}
            onClearAll={handleClearAll}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-[#29190e] bg-[#1a110a] py-4 text-center text-xs text-[#9e8a78]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d97706]" />
            <span className="text-[#faf3e8] font-medium">Smart Exit Guardian</span>
            <span>&bull; NodeMCU ESP8266 IoT Exhibition</span>
          </div>
          <span>Personal Departure Assistant</span>
        </div>
      </footer>

      {/* NodeMCU ESP8266 Live Simulator & Code Modal for Exhibition Demo */}
      <NodeMcuSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onConfirmDeparture={handleRecordJourney}
        apiBaseUrl={travelLogService.getApiBaseUrl()}
      />

    </div>
  );
}
