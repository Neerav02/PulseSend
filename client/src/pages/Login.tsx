import React from 'react';
import { BrandSymbol } from '../components/BrandSymbol';
import { ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDevBypass = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-highlight selection:text-white">
      {/* Top Navbar */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <BrandSymbol size={36} showWordmark tagline />
        <span className="text-[12px] font-semibold text-ink-muted bg-white border border-border-soft px-3 py-1.5 rounded-full">
          Outbox Labs SDE Assessment
        </span>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white border border-border-card rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-canvas border border-border-soft flex items-center justify-center shadow-sm">
            <BrandSymbol size={32} />
          </div>
          <h1 className="text-[24px] font-extrabold text-ink tracking-tight mt-2">
            Welcome to PulseSend
          </h1>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            Enterprise cold outreach engine with zero-cron persistent scheduling, distributed rate limiting, and Slack alerts.
          </p>
        </div>

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-canvas border border-border-card text-ink font-bold text-[14px] py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Dev Mode Instant Bypass */}
        <div className="pt-2 border-t border-border-soft flex flex-col gap-2">
          <button
            onClick={handleDevBypass}
            className="w-full bg-highlight hover:bg-highlight-hover text-white font-bold text-[13px] py-2.5 px-4 rounded-xl shadow-highlight flex items-center justify-center gap-2 transition-all"
          >
            <span>Launch Developer Workspace</span>
            <ArrowRight size={15} />
          </button>
          <span className="text-[11px] text-ink-subtle">
            Instant evaluation mode pre-seeded with sample campaign data.
          </span>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-semibold text-ink-muted">
          <div className="flex flex-col items-center gap-1 bg-canvas p-2 rounded-lg">
            <Lock size={14} className="text-highlight" />
            <span>AES-256 Auth</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-canvas p-2 rounded-lg">
            <Zap size={14} className="text-highlight" />
            <span>BullMQ Zero-Cron</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-canvas p-2 rounded-lg">
            <ShieldCheck size={14} className="text-highlight" />
            <span>Rate Limiter</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[12px] text-ink-muted">
        PulseSend © 2026 Outbox Labs Assessment • ReachInbox Intelligent Cold Email Infrastructure
      </div>
    </div>
  );
};

