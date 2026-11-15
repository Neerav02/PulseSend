import React, { useState } from 'react';
import { BrandSymbol } from '../components/BrandSymbol';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  BarChart3,
  Layers,
  Database,
  Radio,
  X,
  ExternalLink,
  ChevronRight,
  Server,
  Workflow,
  Search,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'limiter' | 'recovery'>('queue');

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleDevBypass = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#151922] font-sans selection:bg-[#FF5733] selection:text-white flex flex-col">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#151922]/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <BrandSymbol size={38} showWordmark tagline darkText />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#5A6475]">
            <a href="#features" className="hover:text-[#151922] transition-colors">
              Features
            </a>
            <a href="#zero-cron" className="hover:text-[#151922] transition-colors">
              Zero-Cron Engine
            </a>
            <a href="#architecture" className="hover:text-[#151922] transition-colors">
              Architecture
            </a>
            <a
              href="http://localhost:5000/admin/queues"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#151922] transition-colors"
            >
              Bull Board <ExternalLink size={13} className="text-[#FF5733]" />
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[13px] font-bold text-[#151922] hover:text-[#FF5733] px-4 py-2 rounded-xl transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="group relative bg-[#FF5733] hover:bg-[#E84A26] active:bg-[#D43F1E] text-white text-[13px] font-extrabold px-5 py-2.5 rounded-xl border border-[#D94220] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(18,22,31,0.12)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_5px_rgba(18,22,31,0.16)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px] flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Subtle Background Radial Pattern */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#FF5733]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#151922]/10 px-4 py-1.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF5733]"></span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#151922]">
              Next-Gen Cold Outreach Infrastructure
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-[#151922] tracking-tight leading-[1.1] max-w-4xl">
            Schedule smarter. <br />
            <span className="text-[#FF5733] underline decoration-[#FF5733]/20 underline-offset-8">
              Deliver reliably.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[#5A6475] max-w-2xl mt-6 leading-relaxed">
            The high-throughput distributed email scheduling platform. Built with Redis
            sorted-set delayed queues, atomic Lua rate-limiting, and zero cron dependency.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="group bg-[#151922] hover:bg-[#1C222E] active:bg-[#0E1117] text-white font-bold text-[15px] px-7 py-3.5 rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.25)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px] flex items-center gap-3"
            >
              <Zap size={18} className="text-[#FF5733] transition-transform duration-200 group-hover:scale-110" />
              <span>Launch Control Deck</span>
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={handleDevBypass}
              className="bg-white hover:bg-[#FAF8F5] active:bg-[#F2ECE4] border border-[#151922]/15 hover:border-[#151922]/30 text-[#151922] font-bold text-[15px] px-6 py-3.5 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 flex items-center gap-2"
            >
              <span>Instant Workspace Access</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full mt-14 bg-white/90 border border-[#151922]/10 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#151922]">0.0 ms</span>
              <span className="text-[12px] font-semibold text-[#5A6475]">Cron Polling Delay</span>
            </div>
            <div className="flex flex-col border-l border-[#151922]/10 pl-4">
              <span className="text-2xl font-black text-[#FF5733]">100%</span>
              <span className="text-[12px] font-semibold text-[#5A6475]">Redis Lua Atomicity</span>
            </div>
            <div className="flex flex-col border-l border-[#151922]/10 pl-4">
              <span className="text-2xl font-black text-[#151922]">5 Workers</span>
              <span className="text-[12px] font-semibold text-[#5A6475]">Concurrent Fleet</span>
            </div>
            <div className="flex flex-col border-l border-[#151922]/10 pl-4">
              <span className="text-2xl font-black text-emerald-600">AES-256</span>
              <span className="text-[12px] font-semibold text-[#5A6475]">Sender Encryption</span>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE FLIGHT DECK PREVIEW */}
        <div className="max-w-5xl mx-auto mt-16 bg-white border border-[#151922]/15 rounded-3xl p-6 sm:p-8 shadow-xl relative">
          <div className="flex items-center justify-between pb-6 border-b border-[#151922]/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-[13px] font-bold text-[#5A6475] ml-2">
                pulsesend.orchestration.flight-deck — v1.0.0
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#151922]/10">
              <button
                onClick={() => setActiveTab('queue')}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'queue' ? 'bg-[#151922] text-white shadow-sm' : 'text-[#5A6475]'
                }`}
              >
                Zero-Cron Queue
              </button>
              <button
                onClick={() => setActiveTab('limiter')}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'limiter' ? 'bg-[#151922] text-white shadow-sm' : 'text-[#5A6475]'
                }`}
              >
                Rate Limiting
              </button>
              <button
                onClick={() => setActiveTab('recovery')}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'recovery' ? 'bg-[#151922] text-white shadow-sm' : 'text-[#5A6475]'
                }`}
              >
                Crash Recovery
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="pt-6">
            {activeTab === 'queue' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#FF5733]/15 text-[#FF5733] text-[11px] font-black uppercase px-2.5 py-1 rounded-md">
                      BullMQ + Redis 7
                    </span>
                    <h3 className="text-xl font-extrabold text-[#151922]">
                      Millisecond Precision Without Database Polling
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#5A6475] leading-relaxed">
                    Instead of running 60-second polling crons, PulseSend registers scheduled emails directly into Redis Sorted Sets with target epoch timestamps. When the clock hits the exact millisecond, the worker pops the job and triggers delivery.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[12px] font-bold text-[#151922]">
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      ⏱️ 2s Staggering Interval
                    </span>
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      🔒 ACID Outbox Locked
                    </span>
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      📬 Real Ethereal Inboxes
                    </span>
                  </div>
                </div>

                <div className="bg-[#151922] text-white p-5 rounded-2xl font-mono text-[11px] leading-relaxed flex flex-col gap-2">
                  <div className="text-emerald-400 font-bold flex items-center justify-between">
                    <span>// BullMQ Redis Telemetry</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-white/60">ZADD email-dispatch-queue:delayed</div>
                  <div className="text-[#FF5733]">score: 1794752687000 (UTC target)</div>
                  <div className="text-white/80">job: email_lead_984712</div>
                  <div className="text-emerald-300 mt-2">→ Worker #1: Active Lock ACQUIRED</div>
                  <div className="text-white/50">→ Ethereal 250 OK: Delivery Confirmed</div>
                </div>
              </div>
            )}

            {activeTab === 'limiter' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase px-2.5 py-1 rounded-md">
                      Atomic Redis Lua
                    </span>
                    <h3 className="text-xl font-extrabold text-[#151922]">
                      Sliding UTC Hour Windows & Auto-Deferral
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#5A6475] leading-relaxed">
                    Multiple workers never exceed sender hourly quotas. When a quota cap (e.g. 50/hr) is hit, excess emails are calculated to the millisecond start of the next UTC hour window and rescheduled in BullMQ without dropping a single lead.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[12px] font-bold text-[#151922]">
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      💬 Deduplicated Slack Alerts
                    </span>
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      ⏰ Top of Next UTC Hour Reschedule
                    </span>
                  </div>
                </div>

                <div className="bg-[#151922] text-white p-5 rounded-2xl font-mono text-[11px] leading-relaxed flex flex-col gap-2">
                  <div className="text-amber-400 font-bold">// Atomic Quota Evaluator</div>
                  <div className="text-white/60">EVAL ratelimit.lua 1 sales@domain.com</div>
                  <div className="text-red-400">Limit: 50 | Current: 50 → BLOCKED</div>
                  <div className="text-amber-300">Rescheduled: 2026-11-15T20:00:00Z</div>
                  <div className="text-emerald-400">Slack Alert: Dispatched to #new-channel</div>
                </div>
              </div>
            )}

            {activeTab === 'recovery' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-800 text-[11px] font-black uppercase px-2.5 py-1 rounded-md">
                      Transactional Outbox
                    </span>
                    <h3 className="text-xl font-extrabold text-[#151922]">
                      Host Crash Resilience & Orphaned Job Recovery
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#5A6475] leading-relaxed">
                    If a container crashes or power fails during execution, PulseSend's boot-time reconciliation service scans PostgreSQL for un-queued or zombie PROCESSING emails, restores them into BullMQ, and finishes delivery safely.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[12px] font-bold text-[#151922]">
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      🛡️ Zero-Loss Guarantee
                    </span>
                    <span className="bg-canvas border border-[#151922]/10 px-3 py-1.5 rounded-lg">
                      🧟 Zombie State Resetting
                    </span>
                  </div>
                </div>

                <div className="bg-[#151922] text-white p-5 rounded-2xl font-mono text-[11px] leading-relaxed flex flex-col gap-2">
                  <div className="text-cyan-400 font-bold">// Boot Reconciliation</div>
                  <div className="text-white/60">SELECT * FROM scheduled_emails</div>
                  <div className="text-white/80">WHERE status IN ('SCHEDULED', 'QUEUED')</div>
                  <div className="text-emerald-300 mt-2">→ Found orphaned job: Recovering...</div>
                  <div className="text-emerald-400">→ Re-enqueued in BullMQ (Delay: 1240ms)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE ARCHITECTURE FEATURES */}
      <section id="features" className="py-20 px-6 bg-white border-y border-[#151922]/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#FF5733]">
              ENGINEERING FOUNDATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151922] tracking-tight mt-2">
              Engineered for Enterprise Cold Outreach
            </h2>
            <p className="text-[#5A6475] text-[15px] mt-3">
              Every component is intentionally selected to eliminate points of failure in distributed bulk email scheduling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <Clock size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Zero-Cron Event Timers</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Replaces high-latency cron polling with Redis sorted sets. Millisecond delivery accuracy without recurring table scan locks on PostgreSQL.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <ShieldCheck size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Atomic Rate Limiter</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Sliding UTC hourly windows enforced via atomic Redis Lua scripts. Auto-defers excess leads to the next hour and alerts Slack once per window.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <Layers size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Multi-Sender Fleet</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Configure distinct sender mailboxes with individual hourly limits and AES-256-GCM encrypted SMTP passwords. Real-time fuel gauge metrics.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <Database size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Transactional Outbox</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                PostgreSQL is the durable source of truth. ACID transaction commits all leads before Redis enqueuing, making sudden worker restarts completely safe.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <Radio size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Elasticsearch 8 Cluster</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Full-text fuzzy search across recipients, subjects, and body content with an automatic, resilient PostgreSQL ILIKE fallback.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                <BarChart3 size={22} className="text-[#FF5733]" />
              </div>
              <h3 className="text-lg font-bold text-[#151922]">Bull Board Observability</h3>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Mounted at <code className="text-[#FF5733]">/admin/queues</code> for real-time telemetry into active, delayed, waiting, and completed job states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ZERO-CRON ARCHITECTURAL COMPARISON */}
      <section id="zero-cron" className="py-20 px-6 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#FF5733]">
              TECHNICAL RATIONALE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151922] tracking-tight mt-2">
              Why Zero-Cron Outperforms Cron Polling
            </h2>
          </div>

          <div className="bg-white border border-[#151922]/15 rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151922] text-white text-[13px] uppercase tracking-wider">
                  <th className="p-4 sm:p-5">Dimension</th>
                  <th className="p-4 sm:p-5 text-red-300">Legacy Cron Polling</th>
                  <th className="p-4 sm:p-5 text-emerald-300 bg-white/5">PulseSend Zero-Cron</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151922]/10 text-[13px]">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#151922]">Dispatch Accuracy</td>
                  <td className="p-4 sm:p-5 text-red-700 bg-red-50/40">
                    Up to 60-second jitter delay
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-800 font-semibold bg-emerald-50/30">
                    Millisecond precision ($O(\log N)$ timer)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#151922]">Database Load While Idle</td>
                  <td className="p-4 sm:p-5 text-red-700 bg-red-50/40">
                    Continuous table scans every minute
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-800 font-semibold bg-emerald-50/30">
                    0% DB CPU utilization while waiting
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#151922]">Thundering Herd Protection</td>
                  <td className="p-4 sm:p-5 text-red-700 bg-red-50/40">
                    Dumps 10,000 rows into worker memory
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-800 font-semibold bg-emerald-50/30">
                    Pops individual jobs via Redis concurrency pool
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#151922]">Horizontal Scaling</td>
                  <td className="p-4 sm:p-5 text-red-700 bg-red-50/40">
                    Requires dangerous row-locking (SKIP LOCKED)
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-800 font-semibold bg-emerald-50/30">
                    BullMQ handles multi-process concurrency
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. SYSTEM ARCHITECTURE & DISTRIBUTED TOPOLOGY */}
      <section id="architecture" className="py-24 px-6 bg-white border-t border-[#151922]/10 scroll-mt-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#FF5733] bg-[#FF5733]/10 px-3.5 py-1 rounded-full border border-[#FF5733]/20">
              DISTRIBUTED SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#151922] tracking-tight mt-4">
              Fault-Tolerant Distributed Architecture
            </h2>
            <p className="text-[#5A6475] text-base sm:text-lg mt-3 leading-relaxed">
              Engineered with transactional persistence, in-memory delayed timers, atomic Redis Lua rate-limiting, and resilient Elasticsearch clustering.
            </p>
          </div>

          {/* 1. VISUAL END-TO-END DATA FLOW PIPELINE */}
          <div className="bg-[#FAF8F5] border border-[#151922]/15 rounded-3xl p-6 sm:p-10 mb-16 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#151922]/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                  <Workflow size={18} className="text-[#FF5733]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#151922]">End-to-End Outreach Dispatch Lifecycle</h3>
                  <p className="text-[12px] text-[#5A6475]">From user submission to verified SMTP delivery and real-time indexing</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Distributed Topology
              </span>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Stage 1 */}
              <div className="bg-white border border-[#151922]/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-[#151922] text-[#FF5733] font-mono text-xs font-black flex items-center justify-center">
                      01
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6475] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#151922]/10">
                      Ingestion
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#151922]">Transactional Outbox</h4>
                  <p className="text-[12px] text-[#5A6475] leading-relaxed">
                    Client posts batch to Express REST API. Records commit to <strong>PostgreSQL 16</strong> within an ACID transaction before queue registration, preventing orphaned state.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#151922]/5 text-[11px] font-mono text-[#151922] flex items-center gap-1.5">
                  <Database size={13} className="text-[#FF5733]" />
                  <span>status: SCHEDULED</span>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-white border border-[#151922]/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-[#151922] text-[#FF5733] font-mono text-xs font-black flex items-center justify-center">
                      02
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6475] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#151922]/10">
                      Scheduling
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#151922]">Zero-Cron Redis Timer</h4>
                  <p className="text-[12px] text-[#5A6475] leading-relaxed">
                    BullMQ pushes delayed job to <strong>Redis 7</strong> Sorted Set with target epoch score. No polling table scans; precise event wakeups.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#151922]/5 text-[11px] font-mono text-[#151922] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#FF5733]" />
                  <span>ZADD delayed timer</span>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="bg-white border border-[#151922]/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-[#151922] text-[#FF5733] font-mono text-xs font-black flex items-center justify-center">
                      03
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6475] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#151922]/10">
                      Concurrency
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#151922]">Atomic Lua Rate Gate</h4>
                  <p className="text-[12px] text-[#5A6475] leading-relaxed">
                    Worker pops job and evaluates atomic Lua script. If sender hourly quota is reached, leads auto-defer to top of next UTC hour and alert Slack.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#151922]/5 text-[11px] font-mono text-[#151922] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>EVAL ratelimit.lua</span>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="bg-white border border-[#151922]/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#FF5733]/40 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-[#151922] text-[#FF5733] font-mono text-xs font-black flex items-center justify-center">
                      04
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6475] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#151922]/10">
                      Delivery
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#151922]">SMTP & Cluster Search</h4>
                  <p className="text-[12px] text-[#5A6475] leading-relaxed">
                    Decrypted AES-256 SMTP transmission with Ethereal preview. Asynchronously indexed in <strong>Elasticsearch 8</strong> with sub-millisecond retrieval.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#151922]/5 text-[11px] font-mono text-[#151922] flex items-center gap-1.5">
                  <Send size={13} className="text-[#FF5733]" />
                  <span>250 OK → ES Ingested</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. INFRASTRUCTURE & STORAGE MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Storage Layer */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                    <Database size={20} className="text-[#FF5733]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#151922]">PostgreSQL 16 Cluster</h3>
                    <span className="text-[11px] font-mono text-[#5A6475]">Port 5433 • ACID Ledger</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#5A6475] leading-relaxed mb-4">
                  Serves as the durable source of truth. Handles relational tenants, sender accounts, and email states with foreign keys and compound indexes.
                </p>
                <ul className="space-y-2 text-[12px] text-[#151922]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Transactional Outbox pattern prevents dual-write corruption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Boot-time reconciliation resets orphaned jobs on crash</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>AES-256-GCM encrypted SMTP credentials</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Box 2: Queue & Cache Layer */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                    <Server size={20} className="text-[#FF5733]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#151922]">Redis 7 & BullMQ</h3>
                    <span className="text-[11px] font-mono text-[#5A6475]">Port 6380 • Sorted Sets</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#5A6475] leading-relaxed mb-4">
                  In-memory distributed coordination engine. Manages millisecond delayed timers, distributed worker locking, and atomic rate enforcement.
                </p>
                <ul className="space-y-2 text-[12px] text-[#151922]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>5 concurrent worker fleet with graceful shutdown</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Atomic Lua sliding-window rate limiting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Zero cron polling overhead with event-driven delay timers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Box 3: Search & Observability */}
            <div className="bg-[#FAF8F5] border border-[#151922]/10 rounded-2xl p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#151922] text-white flex items-center justify-center">
                    <Search size={20} className="text-[#FF5733]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#151922]">Elasticsearch 8.14.3</h3>
                    <span className="text-[11px] font-mono text-[#5A6475]">Port 9200 • Inverted Index</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#5A6475] leading-relaxed mb-4">
                  Sub-millisecond full-text search indexing across recipients, subjects, and email content with automatic PostgreSQL fallback.
                </p>
                <ul className="space-y-2 text-[12px] text-[#151922]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Dedicated <code className="font-mono text-[11px] bg-white px-1 border border-border-soft rounded">pulsesend-emails-v1</code> index</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Resilient auto-fallback to SQL ILIKE search</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Slack Webhook alerts on delivery & quota events</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto bg-[#151922] text-white py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <BrandSymbol size={32} showWordmark tagline />

          <div className="text-[12px] text-white/50 text-center sm:text-right">
            <div>PulseSend © 2026 • Intelligent Email Orchestration Platform</div>
            <div className="text-white/40 mt-1">
              Architected & Engineered by Neerav Babel
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. HIGH-CONVERTING INTERACTIVE SIGN-IN MODAL */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151922]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white border border-[#151922]/15 rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 text-[#5A6475] hover:text-[#151922] p-1.5 rounded-full hover:bg-canvas transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#151922]/10 flex items-center justify-center shadow-sm">
                <BrandSymbol size={36} />
              </div>
              <h2 className="text-2xl font-black text-[#151922] tracking-tight mt-2">
                Sign In to PulseSend
              </h2>
              <p className="text-[13px] text-[#5A6475] leading-relaxed">
                Connect with your Google account to access your cold outreach flight deck.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Real Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-[#FAF8F5] active:bg-[#F2ECE4] border border-[#151922]/20 text-[#151922] font-bold text-[14px] py-3.5 px-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px]"
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

              {/* Instant Workspace Access Button */}
              <button
                onClick={handleDevBypass}
                className="group w-full bg-[#FF5733] hover:bg-[#E84A26] active:bg-[#D43F1E] text-white font-extrabold text-[14px] py-3.5 px-4 rounded-xl border border-[#D94220] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(18,22,31,0.14)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_5px_rgba(18,22,31,0.18)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px] flex items-center justify-center gap-2"
              >
                <span>Launch Production Console</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Security Badges */}
            <div className="pt-4 border-t border-[#151922]/10 grid grid-cols-3 gap-2 text-[11px] font-semibold text-[#5A6475]">
              <div className="flex flex-col items-center gap-1">
                <Lock size={15} className="text-[#FF5733]" />
                <span>AES-256 Auth</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap size={15} className="text-[#FF5733]" />
                <span>Zero-Cron Timer</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={15} className="text-[#FF5733]" />
                <span>Rate Limiter</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
