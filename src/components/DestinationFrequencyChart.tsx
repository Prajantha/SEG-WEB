import React, { useState } from 'react';
import { Destination } from '../types';
import { DESTINATION_CONFIGS } from '../utils/destinations';

interface DestinationFrequencyChartProps {
  breakdown: Record<Destination, number>;
  totalJourneys: number;
}

interface SliceData {
  destination: Destination;
  count: number;
  percentage: number;
  color: string;
  darkColor: string;
  startAngle: number;
  endAngle: number;
  pathD: string;
}

export const DestinationFrequencyChart: React.FC<DestinationFrequencyChartProps> = ({
  breakdown,
  totalJourneys,
}) => {
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const destinations: Destination[] = ['College', 'Gym', 'Trip'];

  // Donut geometry
  const radius = 76;
  const innerRadius = 50;
  const cx = 100;
  const cy = 100;

  let currentAngle = -90; // Start at 12 o'clock
  const slices: SliceData[] = [];

  destinations.forEach((dest) => {
    const count = breakdown[dest] || 0;
    const percentage = totalJourneys > 0 ? (count / totalJourneys) * 100 : 0;
    const sweepAngle = totalJourneys > 0 ? (count / totalJourneys) * 360 : 0;

    const startAngle = currentAngle;
    const endAngle = currentAngle + sweepAngle;
    currentAngle = endAngle;

    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    let pathD = '';
    if (count > 0) {
      if (count === totalJourneys) {
        pathD = `
          M ${cx} ${cy - radius}
          A ${radius} ${radius} 0 1 0 ${cx} ${cy + radius}
          A ${radius} ${radius} 0 1 0 ${cx} ${cy - radius}
          M ${cx} ${cy - innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${cx} ${cy + innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 1 ${cx} ${cy - innerRadius}
          Z
        `;
      } else {
        const startRadAngle = startAngle + 90;
        const endRadAngle = endAngle + 90;
        const p1 = polarToCartesian(cx, cy, radius, startRadAngle);
        const p2 = polarToCartesian(cx, cy, radius, endRadAngle);
        const p3 = polarToCartesian(cx, cy, innerRadius, endRadAngle);
        const p4 = polarToCartesian(cx, cy, innerRadius, startRadAngle);
        const largeArcFlag = sweepAngle > 180 ? 1 : 0;

        pathD = `
          M ${p1.x} ${p1.y}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}
          L ${p3.x} ${p3.y}
          A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}
          Z
        `;
      }
    }

    slices.push({
      destination: dest,
      count,
      percentage,
      color: DESTINATION_CONFIGS[dest].color,
      darkColor: DESTINATION_CONFIGS[dest].darkColor,
      startAngle,
      endAngle,
      pathD,
    });
  });

  const activeCount = activeDestination
    ? breakdown[activeDestination] || 0
    : totalJourneys;

  const activePct = activeDestination
    ? totalJourneys > 0
      ? Math.round(((breakdown[activeDestination] || 0) / totalJourneys) * 100)
      : 0
    : 100;

  return (
    <div
      id="section-destination-frequency"
      className="rounded-xl bg-[#22160f] border border-[#3d2719] p-5 sm:p-6 shadow-sm"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#362114]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#faf3e8] tracking-tight">
            DESTINATION FREQUENCY
          </h2>
          <p className="text-xs text-[#c8b39e] mt-0.5">
            Total verified departure journeys recorded per destination
          </p>
        </div>
        <div className="text-xs font-mono text-[#d4c2b0] bg-[#1a110a] px-3 py-1 rounded border border-[#382315]">
          Total: <span className="text-[#faf3e8] font-bold">{totalJourneys}</span>
        </div>
      </div>

      {/* Grid: Donut Chart on Left, Counts and Bars on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transform -rotate-90"
            >
              {totalJourneys === 0 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={(radius + innerRadius) / 2}
                  fill="transparent"
                  stroke="#382315"
                  strokeWidth={radius - innerRadius}
                  strokeDasharray="4 4"
                />
              ) : (
                slices.map((slice) => {
                  if (slice.count === 0) return null;
                  const isHovered = activeDestination === slice.destination;
                  return (
                    <path
                      key={slice.destination}
                      d={slice.pathD}
                      fill={slice.color}
                      opacity={activeDestination && !isHovered ? 0.4 : 1}
                      stroke="#22160f"
                      strokeWidth={2}
                      className="transition-opacity duration-200 cursor-pointer"
                      onMouseEnter={() => setActiveDestination(slice.destination)}
                      onMouseLeave={() => setActiveDestination(null)}
                    />
                  );
                })
              )}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-mono text-[#c8b39e] uppercase">
                {activeDestination || 'Total'}
              </span>
              <span className="text-2xl font-bold text-[#faf3e8]">
                {activeCount}
              </span>
              <span className="text-[11px] font-mono text-[#d97706]">
                {totalJourneys > 0 ? `${activePct}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown List for College, Gym, Trip */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          {destinations.map((dest) => {
            const count = breakdown[dest] || 0;
            const percentage =
              totalJourneys > 0 ? ((count / totalJourneys) * 100).toFixed(1) : '0.0';
            const config = DESTINATION_CONFIGS[dest];
            const isHovered = activeDestination === dest;

            return (
              <div
                key={dest}
                id={`freq-row-${dest.toLowerCase()}`}
                onMouseEnter={() => setActiveDestination(dest)}
                onMouseLeave={() => setActiveDestination(null)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-[#2b1c13] border-[#5a3821]'
                    : 'bg-[#1a110a] border-[#362114] hover:border-[#4a2e1b]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-sm font-semibold text-[#faf3e8]">
                      {dest}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#faf3e8] font-bold">
                      {count} {count === 1 ? 'journey' : 'journeys'}
                    </span>
                    <span className="text-[#c8b39e]">
                      ({percentage}%)
                    </span>
                  </div>
                </div>

                {/* Simple Horizontal Frequency Bar */}
                <div className="w-full h-2 rounded-full bg-[#2d1c12] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${totalJourneys > 0 ? (count / totalJourneys) * 100 : 0}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
