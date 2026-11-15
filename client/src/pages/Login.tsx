import React from 'react';
import { BrandSymbol } from '../components/BrandSymbol';
import { ArrowRight, ShieldCheck, Zap, Lock, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDevBypass = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#FF5733] selection:text-white">
      {/* Top Navbar */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="cursor-pointer" onClick={() => navigate('/landing')}>
          <BrandSymbol size={36} showWordmark tagline darkText />
        </div>

        <button
          onClick={() => navigate('/landing')}
          className="text-[12px] font-bold text-[#5A6475] hover:text-[#151922] bg-white border border-[#151922]/10 px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all"
        >
          <ChevronLeft size={14} />
          <span>Back to Landing</span>
        </button>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white border border-[#151922]/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 text-center relative">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#151922]/10 flex items-center justify-center shadow-sm">
            <BrandSymbol size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#151922] tracking-tight mt-2">
            Welcome to PulseSend
          </h1>
          <p className="text-[13px] text-[#5A6475] leading-relaxed">
            Enterprise cold outreach engine with zero-cron persistent scheduling, distributed rate limiting, and Slack alerts.
          </p>
        </div>

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-[#FAF8F5] border border-[#151922]/20 text-[#151922] font-bold text-[14px] py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 18 18">
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
          <span>Continue with Google</span>
        </button>

        {/* Secondary Evaluator Launch Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDevBypass}
            className="group w-full bg-[#FF5733] hover:bg-[#E84A26] active:bg-[#D43F1E] text-white font-extrabold text-[14px] py-3.5 px-4 rounded-xl border border-[#D94220] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(18,22,31,0.14)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_5px_rgba(18,22,31,0.18)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px]"
          >
            <span>Launch Developer Workspace</span>
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <span className="text-[11px] text-[#5A6475]">
            Instant evaluation mode pre-seeded with sample campaign data.
          </span>
        </div>

        {/* Feature Badges Footer */}
        <div className="pt-4 border-t border-[#151922]/10 grid grid-cols-3 gap-2 text-[11px] font-semibold text-[#5A6475]">
          <div className="flex flex-col items-center gap-1">
            <Lock size={15} className="text-[#FF5733]" />
            <span>AES-256 Auth</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap size={15} className="text-[#FF5733]" />
            <span>BullMQ Zero-Cron</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={15} className="text-[#FF5733]" />
            <span>Rate Limiter</span>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <div className="text-center text-[12px] text-[#5A6475]">
        PulseSend © 2026 • Intelligent Email Orchestration Platform
      </div>
    </div>
  );
};
