import React, { useEffect, useState } from 'react';

interface CountdownBadgeProps {
  targetDate: string | Date;
  status?: string;
  className?: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  targetDate,
  status = 'SCHEDULED',
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    totalMs: number;
    formatted: string;
    isImmediate: boolean;
  }>({
    totalMs: 0,
    formatted: '00m 00s',
    isImmediate: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          totalMs: 0,
          formatted: 'Due Now',
          isImmediate: true,
        });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let formatted = '';
      if (hours > 0) {
        formatted = `${hours}h ${String(minutes).padStart(2, '0')}m`;
      } else {
        formatted = `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      }

      // Mark as immediate highlight if less than 5 minutes away
      const isImmediate = diff < 5 * 60 * 1000;

      setTimeLeft({
        totalMs: diff,
        formatted,
        isImmediate,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (status === 'SENT') {
    return (
      <span className="font-mono text-[12px] font-semibold text-status-ok bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
        Delivered
      </span>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <span className="font-mono text-[12px] font-semibold text-ink-subtle bg-canvas-soft border border-border-soft px-2.5 py-1 rounded-md">
        Cancelled
      </span>
    );
  }

  if (status === 'RATE_LIMITED_DEFERRED') {
    return (
      <span className="font-mono text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md">
        Deferred ({timeLeft.formatted})
      </span>
    );
  }

  if (timeLeft.isImmediate) {
    return (
      <span
        className={`font-mono text-[12px] font-bold text-white bg-highlight shadow-sm shadow-highlight/40 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        {timeLeft.formatted}
      </span>
    );
  }

  return (
    <span
      className={`font-mono text-[12px] font-semibold text-ink bg-canvas border border-border-soft px-2.5 py-1 rounded-md ${className}`}
    >
      {timeLeft.formatted}
    </span>
  );
};

