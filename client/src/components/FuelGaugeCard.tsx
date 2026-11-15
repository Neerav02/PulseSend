import React from 'react';
import { Mail } from 'lucide-react';

interface FuelGaugeCardProps {
  email: string;
  displayName: string;
  consumed: number;
  limit: number;
  remaining: number;
  percent: number;
}

export const FuelGaugeCard: React.FC<FuelGaugeCardProps> = ({
  email,
  displayName,
  consumed,
  limit,
  remaining,
  percent,
}) => {
  const isHighUtilization = percent >= 80;
  const isCapped = remaining === 0;

  return (
    <div className="bg-canvas-white border border-border-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isHighUtilization ? 'bg-highlight-subtle text-highlight' : 'bg-canvas text-ink-muted'
            }`}
          >
            <Mail size={15} />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-[13px] font-bold text-ink truncate">{email}</span>
            <span className="text-[11px] text-ink-muted truncate">{displayName}</span>
          </div>
        </div>

        <span
          className={`font-mono text-[13px] font-bold px-2 py-0.5 rounded-md border ${
            isHighUtilization
              ? 'bg-highlight-subtle border-highlight-border text-highlight'
              : 'bg-canvas border-border-soft text-ink'
          }`}
        >
          {consumed} / {limit}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full bg-canvas rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHighUtilization
              ? 'bg-highlight shadow-[0_0_10px_rgba(255,87,51,0.4)]'
              : 'bg-ink'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] font-medium text-ink-muted">
        <span>Quota: {limit} emails/hr</span>
        {isCapped ? (
          <span className="text-highlight font-bold">Auto-Deferral Active</span>
        ) : isHighUtilization ? (
          <span className="text-highlight font-semibold">{remaining} slots left</span>
        ) : (
          <span>{remaining} slots available</span>
        )}
      </div>
    </div>
  );
};
