import React, { useState } from 'react';
import {
  X,
  Cpu,
  Play,
  CheckCircle2,
  CloudSun,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Send,
  Code2,
  Terminal,
  Check,
  Sparkles,
  Info,
  GraduationCap,
  Dumbbell,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Destination } from '../types';
import { DESTINATION_CONFIGS } from '../utils/destinations';

interface NodeMcuSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeparture: (destination: Destination) => Promise<void>;
  apiBaseUrl: string;
}

type DeviceStep =
  | 'idle'
  | 'welcome'
  | 'select_destination'
  | 'checklist_weather'
  | 'departure_confirmed';

export const NodeMcuSimulatorModal: React.FC<NodeMcuSimulatorModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeparture,
  apiBaseUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  const [currentStep, setCurrentStep] = useState<DeviceStep>('idle');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  // Weather simulation for selected destination
  const mockWeather: Record<Destination, { temp: string; condition: string; tip: string }> = {
    College: { temp: '22°C', condition: 'Partly Cloudy', tip: 'Mild temperature, pleasant commute.' },
    Gym: { temp: '26°C', condition: 'Sunny & Humid', tip: 'Stay hydrated! Keep a cold water bottle ready.' },
    Trip: { temp: '19°C', condition: 'Scattered Showers', tip: 'Rain likely later today. Pack light umbrella.' },
  };

  const handleStartButton = () => {
    setPostError(null);
    setCurrentStep('welcome');
    setTimeout(() => {
      setCurrentStep('select_destination');
    }, 1200);
  };

  const handleSelectDestination = (dest: Destination) => {
    setPostError(null);
    setSelectedDestination(dest);
    setCurrentStep('checklist_weather');
  };

  const handleChangeDestination = () => {
    // Demonstrates rule: Going back clears previous selection without logging it!
    setPostError(null);
    setCurrentStep('select_destination');
  };

  const handleFinalConfirm = async () => {
    if (!selectedDestination) return;
    setIsPosting(true);
    setPostError(null);
    try {
      await onConfirmDeparture(selectedDestination);
      setCurrentStep('departure_confirmed');
      setTimeout(() => {
        // Reset device to idle after goodbye
        setTimeout(() => {
          onClose();
          setCurrentStep('idle');
          setSelectedDestination(null);
        }, 1800);
      }, 1500);
    } catch (err) {
      console.error('Failed to confirm departure:', err);
      setPostError(
        err instanceof Error ? err.message : 'Database/API request failed. Check server connection.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleQuickPost = async (dest: Destination) => {
    setIsPosting(true);
    setPostError(null);
    try {
      await onConfirmDeparture(dest);
      onClose();
    } catch (err) {
      console.error('Failed to quick-post departure:', err);
      setPostError(
        err instanceof Error ? err.message : 'Database/API request failed. Check server connection.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const fullApiUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/journeys`
      : 'https://your-domain.com/api/journeys';

  const arduinoCode = `/*
 * Smart Exit Guardian (SEG) - ESP8266 NodeMCU Firmware
 * Target: NodeMCU ESP-12E (ESP8266)
 * Description: Sends HTTP POST when departure is confirmed
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Endpoint
const char* serverEndpoint = "${fullApiUrl}";

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
}

// Function called ONLY when user reaches the FINAL confirmation
void sendConfirmedDeparture(String destination) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    // JSON Payload with confirmed destination
    String jsonPayload = "{\\"destination\\":\\"" + destination + "\\"}";

    Serial.print("[SEG] Sending Departure: ");
    Serial.println(destination);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Server Response Code: ");
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("HTTP POST Error: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Error: WiFi Disconnected");
  }
}

void loop() {
  // 1. Wait for START button
  // 2. Display Welcome
  // 3. Let user select destination
  // 4. Show checklist & weather
  // 5. Allow switching destination
  // 6. On FINAL Goodbye confirmation:
  //    sendConfirmedDeparture("College"); // or "Gym", "Trip"
}
`;

  const curlCommand = `curl -X POST ${fullApiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"destination":"College"}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#1f150e] border border-[#3d2719] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#362114] bg-[#1a110a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2e1d13] text-[#d97706] border border-[#4d301e]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#faf3e8]">
                NodeMCU ESP8266 Demonstration Tool
              </h3>
              <p className="text-xs text-[#c8b39e]">
                Simulate physical departure flow & inspect Arduino C++ source
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c8b39e] hover:text-[#faf3e8] hover:bg-[#2b1c13] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#362114] px-5 pt-2 bg-[#170f09] gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-[#d97706] text-[#faf3e8] font-semibold'
                : 'border-transparent text-[#9e8a78] hover:text-[#d4c2b0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive 8-Step Device Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-[#d97706] text-[#faf3e8] font-semibold'
                : 'border-transparent text-[#9e8a78] hover:text-[#d4c2b0]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>ESP8266 Arduino C++ & cURL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'simulator' ? (
            <div className="space-y-5">
              
              {/* Hardware Mock Frame */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#140d08] border border-[#382315] relative">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#29190e] text-xs text-[#c8b39e] font-mono">
                  <span className="flex items-center gap-1.5 text-[#d97706]">
                    <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                    ESP8266 OLED / LCD SIMULATOR
                  </span>
                  <span>128 x 64 Display</span>
                </div>

                {/* Ingress / Database Error Alert */}
                {postError && (
                  <div className="mb-3 p-3 rounded-lg bg-[#3a1a12] border border-[#7a2e1d] text-[#fca5a5] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#f87171] flex-shrink-0" />
                      <span>{postError}</span>
                    </div>
                    {selectedDestination && (
                      <button
                        type="button"
                        onClick={handleFinalConfirm}
                        className="px-2.5 py-1 rounded bg-[#5a2318] hover:bg-[#6e2b1e] text-[#faf3e8] text-xs font-semibold flex items-center gap-1 self-end sm:self-auto transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}

                {/* State: Idle */}
                {currentStep === 'idle' && (
                  <div className="py-6 text-center space-y-4">
                    <div className="text-[#faf3e8] font-mono text-sm">
                      [SMART EXIT GUARDIAN READY]
                    </div>
                    <p className="text-xs text-[#c8b39e] max-w-sm mx-auto">
                      Press physical START button to initiate departure sequence.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartButton}
                      className="px-6 py-2.5 rounded-lg bg-[#854d0e] hover:bg-[#a16207] text-[#faf3e8] font-bold text-sm active:scale-95 transition-all inline-flex items-center gap-2 border border-[#b45309]"
                    >
                      <Play className="w-4 h-4" />
                      <span>PRESS START BUTTON</span>
                    </button>
                  </div>
                )}

                {/* State: Welcome */}
                {currentStep === 'welcome' && (
                  <div className="py-8 text-center space-y-2 animate-fadeIn">
                    <div className="text-lg font-bold text-[#faf3e8]">
                      WELCOME TO SMART EXIT GUARDIAN
                    </div>
                    <p className="text-xs text-[#c8b39e] font-mono">
                      Initializing departure assistant module...
                    </p>
                  </div>
                )}

                {/* State: Select Destination */}
                {currentStep === 'select_destination' && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-[#c8b39e] uppercase">
                      Select Your Destination:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['College', 'Gym', 'Trip'] as Destination[]).map((dest) => {
                        const cfg = DESTINATION_CONFIGS[dest];
                        return (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => handleSelectDestination(dest)}
                            className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all hover:scale-[1.02] ${cfg.borderAccent} ${cfg.badgeBg}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-[#faf3e8] text-sm">{dest}</span>
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: cfg.color }}
                              />
                            </div>
                            <span className="text-[11px] text-[#c8b39e]">View checklist & weather</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#d97706] font-mono text-center">
                      * Note: Merely selecting a destination does NOT record it yet.
                    </p>
                  </div>
                )}

                {/* State: Checklist & Weather */}
                {currentStep === 'checklist_weather' && selectedDestination && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#29190e] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#c8b39e] font-mono">Destination:</span>
                        <span className="text-sm font-bold text-[#faf3e8] px-2 py-0.5 rounded bg-[#2e1d13] border border-[#523320]">
                          {selectedDestination}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#d97706]">
                        <CloudSun className="w-3.5 h-3.5" />
                        <span className="font-mono">
                          {mockWeather[selectedDestination].temp} &bull; {mockWeather[selectedDestination].condition}
                        </span>
                      </div>
                    </div>

                    {/* Checklist items */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-[#c8b39e] uppercase">
                        SEG Pre-Departure Checklist:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DESTINATION_CONFIGS[selectedDestination].checklist.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#1f140d] border border-[#382315] text-xs text-[#faf3e8]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Flow Demonstration Buttons: Go Back vs Final Confirm */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={handleChangeDestination}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2b1c13] hover:bg-[#382419] text-[#faf3e8] text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-[#3d2719]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Go Back / Change Destination</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPosting}
                        onClick={handleFinalConfirm}
                        className="w-full sm:flex-1 px-4 py-2 rounded-lg bg-[#854d0e] hover:bg-[#a16207] text-[#faf3e8] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-[#b45309]"
                      >
                        {isPosting ? (
                          <span>Sending HTTP POST to Server...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Confirm Departure & Goodbye</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#24170f] border border-[#3d2719] text-[11px] text-[#c8b39e] font-mono">
                      Rule verified: If you go back and change destination, only the final confirmed one will be recorded in the database!
                    </div>
                  </div>
                )}

                {/* State: Confirmed & Goodbye */}
                {currentStep === 'departure_confirmed' && (
                  <div className="py-8 text-center space-y-3 animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-[#3d2719] border border-[#784617] text-[#d97706] flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="text-lg font-bold text-[#faf3e8]">
                      GOODBYE! HAVE A SAFE JOURNEY!
                    </div>
                    <p className="text-xs font-mono text-[#d97706]">
                      HTTP POST 201 &bull; {selectedDestination} logged to database!
                    </p>
                    <p className="text-[11px] text-[#9e8a78] font-mono">
                      SEG device resetting to standby...
                    </p>
                  </div>
                )}

              </div>

              {/* 1-Click Fast Ingress Buttons for Presentation Convenience */}
              <div className="pt-2 border-t border-[#362114]">
                <div className="text-xs font-semibold text-[#faf3e8] mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Exhibition Quick Test (Direct NodeMCU POST):</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isPosting}
                    onClick={() => handleQuickPost('College')}
                    className="p-2 rounded-lg bg-[#2e1d13] hover:bg-[#3d2719] text-[#fcd34d] border border-[#784617] text-xs font-medium transition-all"
                  >
                    + POST &quot;College&quot;
                  </button>
                  <button
                    type="button"
                    disabled={isPosting}
                    onClick={() => handleQuickPost('Gym')}
                    className="p-2 rounded-lg bg-[#2a170d] hover:bg-[#381f12] text-[#fdba74] border border-[#823c14] text-xs font-medium transition-all"
                  >
                    + POST &quot;Gym&quot;
                  </button>
                  <button
                    type="button"
                    disabled={isPosting}
                    onClick={() => handleQuickPost('Trip')}
                    className="p-2 rounded-lg bg-[#241811] hover:bg-[#332218] text-[#f5d0b1] border border-[#663e20] text-xs font-medium transition-all"
                  >
                    + POST &quot;Trip&quot;
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* cURL Command */}
              <div>
                <div className="flex items-center justify-between text-[#faf3e8] mb-1.5 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#d97706]" />
                    Test Ingress via cURL Terminal:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="text-[#d97706] hover:text-[#f59e0b] text-xs flex items-center gap-1"
                  >
                    {copiedCurl ? <Check className="w-3 h-3" /> : null}
                    <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#140d08] border border-[#382315] rounded-lg font-mono text-[#faf3e8] overflow-x-auto text-[11px] leading-relaxed">
                  {curlCommand}
                </pre>
              </div>

              {/* Arduino ESP8266 Code Snippet */}
              <div>
                <div className="flex items-center justify-between text-[#faf3e8] mb-1.5 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#d97706]" />
                    NodeMCU ESP8266 Arduino C++ Sketch:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(arduinoCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[#d97706] hover:text-[#f59e0b] text-xs flex items-center gap-1 font-semibold"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : null}
                    <span>{copiedCode ? 'Copied' : 'Copy Arduino Sketch'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-[#140d08] border border-[#382315] rounded-lg font-mono text-[#faf3e8] overflow-x-auto text-[11px] max-h-64 leading-relaxed">
                  {arduinoCode}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-[#24170f] border border-[#382315] text-[#c8b39e] leading-relaxed">
                <span className="text-[#faf3e8] font-bold">Hardware Note:</span> The NodeMCU connects to Wi-Fi and issues an HTTP POST to <code className="text-[#faf3e8] font-mono bg-[#140d08] px-1 py-0.5 rounded border border-[#382315]">{fullApiUrl}</code>. The server automatically timestamps the record with the current date &amp; time.
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#362114] bg-[#1a110a] flex items-center justify-between text-xs text-[#9e8a78]">
          <span className="font-mono text-[11px]">
            API Target: <code className="text-[#d97706]">{apiBaseUrl}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2b1c13] hover:bg-[#382419] text-[#faf3e8] font-medium transition-colors border border-[#3d2719]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
