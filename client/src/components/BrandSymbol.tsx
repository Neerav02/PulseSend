import React from 'react';

interface BrandSymbolProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  tagline?: boolean;
}

export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 32,
  className = '',
  showWordmark = false,
  tagline = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background rounded badge */}
        <rect width="48" height="48" rx="12" fill="#151922" />

        {/* Outer Scheduling Orbital Arc */}
        <path
          d="M 12 18 C 12 11.37 17.37 6 24 6 C 30.63 6 36 11.37 36 18"
          stroke="#FF5733"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="4"
          opacity="0.45"
        />
        <circle cx="36" cy="18" r="2.5" fill="#FF5733" />

        {/* Envelope Facet */}
        <path
          d="M 10 18 C 10 16.34 11.34 15 13 15 L 35 15 C 36.66 15 38 16.34 38 18 L 38 34 C 38 35.66 36.66 37 35 37 L 13 37 C 11.34 37 10 35.66 10 34 Z"
          fill="#1D2330"
          stroke="#2D3546"
          strokeWidth="1.5"
        />

        {/* Flap creases */}
        <path
          d="M 11 16 L 24 26 L 37 16"
          stroke="#3D475C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* PulseSend Radiant Pulse Wave */}
        <path
          d="M 8 28 L 16 28 L 20 20 L 25 34 L 29 25 L 33 28 L 40 28"
          stroke="#FF5733"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active Node Spark */}
        <circle cx="25" cy="34" r="2" fill="#FFFFFF" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[17px] tracking-tight text-white leading-none">
            Pulse<span className="text-highlight">Send</span>
          </span>
          {tagline && (
            <span className="text-[11px] font-medium text-ink-subtle tracking-normal mt-1">
              Schedule smarter. Deliver reliably.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

