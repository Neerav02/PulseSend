import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, X, ExternalLink, ShieldCheck, MailCheck } from 'lucide-react';
import { FuelGaugeCard } from '../components/FuelGaugeCard';
import { CountdownBadge } from '../components/CountdownBadge';
import { ComposeModal } from '../components/ComposeModal';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedInspectionEmail, setSelectedInspectionEmail] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, schedRes] = await Promise.all([
        axios.get('/api/analytics/dashboard', { withCredentials: true }),
        axios.get('/api/emails/scheduled?limit=6', { withCredentials: true }),
      ]);

      if (statsRes.data?.success) {
        setData(statsRes.data.data);
      }
      if (schedRes.data?.success) {
        setScheduledEmails(schedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 8 seconds for real-time queue updates
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* 1. SENDER CAPACITY FUEL CARDS (TOP TELEMETRY ROW) */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">
            Active Sender Hourly Quotas
          </span>
          <span className="text-[12px] font-semibold text-ink-muted bg-white border border-border-soft px-3 py-1 rounded-md font-mono">
            Next UTC Window Resets at top of hour
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data?.senderGauges?.length > 0 ? (
            data.senderGauges.map((sender: any) => (
              <FuelGaugeCard
                key={sender.id}
                email={sender.email}
                displayName={sender.displayName}
                consumed={sender.consumed}
                limit={sender.hourlyLimit}
                remaining={sender.remaining}
                percent={sender.percent}
              />
            ))
          ) : (
            <div className="col-span-3 bg-white border border-border-soft rounded-xl p-6 text-center text-ink-muted text-[13px]">
              No active senders configured yet. Add a sender to view real-time quota telemetry.
            </div>
          )}
        </div>
      </section>

      {/* 2. ACTION HERO ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink tracking-tight">
            Scheduled Dispatch Stream
          </h1>
          <p className="text-[13px] text-ink-muted mt-0.5">
            Zero-cron BullMQ persistent queue. Automatic rate-limit deferral & restart recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-lg border border-border-soft bg-white text-ink-muted hover:text-ink hover:bg-canvas transition-colors shadow-sm"
            title="Refresh stream"
          >
            <RefreshCw size={16} />
          </button>

          {/* THE 10% INTENTIONAL HIGHLIGHT ACTION BUTTON */}
          <button
            onClick={() => setIsComposeOpen(true)}
            className="group relative bg-[#FF5733] hover:bg-[#E84A26] active:bg-[#D43F1E] text-white font-bold text-[13px] px-5 py-2.5 rounded-lg border border-[#D94220] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(18,22,31,0.12)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_5px_rgba(18,22,31,0.16)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] flex items-center gap-2 transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px]"
          >
            <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90 text-white" />
            <span>Schedule New Outreach</span>
          </button>
        </div>
      </div>

      {/* 3. METRIC KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border-soft rounded-xl p-4 shadow-card flex flex-col">
          <span className="text-[11px] font-bold text-ink-muted uppercase">Pending / Scheduled</span>
          <span className="text-[24px] font-extrabold text-ink font-mono mt-1">
            {data?.metrics?.scheduledCount ?? 0}
          </span>
        </div>
        <div className="bg-white border border-border-soft rounded-xl p-4 shadow-card flex flex-col">
          <span className="text-[11px] font-bold text-ink-muted uppercase">Total Delivered</span>
          <span className="text-[24px] font-extrabold text-status-ok font-mono mt-1">
            {data?.metrics?.sentCount ?? 0}
          </span>
        </div>
        <div className="bg-white border border-border-soft rounded-xl p-4 shadow-card flex flex-col">
          <span className="text-[11px] font-bold text-ink-muted uppercase">Quota-Deferred</span>
          <span className="text-[24px] font-extrabold text-amber-600 font-mono mt-1">
            {data?.metrics?.deferredCount ?? 0}
          </span>
        </div>
        <div className="bg-white border border-border-soft rounded-xl p-4 shadow-card flex flex-col">
          <span className="text-[11px] font-bold text-ink-muted uppercase">Failed / Dead-letter</span>
          <span className="text-[24px] font-extrabold text-status-error font-mono mt-1">
            {data?.metrics?.failedCount ?? 0}
          </span>
        </div>
      </div>

      {/* 4. SCHEDULED STREAM TABLE */}
      <div className="bg-white border border-border-card rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border-soft flex items-center justify-between bg-canvas">
          <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
            Up Next In Queue
          </span>
          <span className="text-[11px] text-ink-muted font-medium">
            Auto-refreshing every 8 seconds
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas-soft border-b border-border-soft text-ink-muted text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-5">Next Dispatch</th>
                <th className="py-3 px-5">Lead / Recipient</th>
                <th className="py-3 px-5">Subject Line</th>
                <th className="py-3 px-5">Sender</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {scheduledEmails.length > 0 ? (
                scheduledEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <CountdownBadge targetDate={email.scheduledAt} status={email.status} />
                    </td>
                    <td className="py-3.5 px-5 font-bold text-ink">{email.recipientEmail}</td>
                    <td className="py-3.5 px-5 text-ink-muted truncate max-w-xs">{email.subject}</td>
                    <td className="py-3.5 px-5 text-ink-muted font-mono text-[12px]">
                      {email.sender?.email || 'outreach@pulsesend.io'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-canvas border border-border-soft">
                        {email.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedInspectionEmail(email)}
                        className="text-[12px] font-bold text-ink hover:text-highlight transition-colors bg-canvas hover:bg-white border border-border-soft px-3 py-1 rounded-md"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted text-[13px]">
                    No scheduled outreach jobs currently queued. Click{' '}
                    <strong className="text-highlight">Schedule New Outreach</strong> to launch a campaign.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SLIDE-OUT INSPECTION DRAWER */}
      {selectedInspectionEmail && (
        <div className="fixed inset-0 bg-ink-sidebar/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white border-l border-border-card w-full max-w-md h-full p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-highlight" />
                <h3 className="font-bold text-[16px] text-ink">Delivery Forensics</h3>
              </div>
              <button
                onClick={() => setSelectedInspectionEmail(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-[12px]">
              <div>
                <span className="font-bold text-ink-muted uppercase text-[10px]">Recipient Email</span>
                <p className="font-mono font-bold text-ink text-[13px] mt-0.5">
                  {selectedInspectionEmail.recipientEmail}
                </p>
              </div>

              <div>
                <span className="font-bold text-ink-muted uppercase text-[10px]">Assigned Mailbox</span>
                <p className="font-mono text-ink text-[13px] mt-0.5">
                  {selectedInspectionEmail.sender?.email || 'N/A'}
                </p>
              </div>

              <div>
                <span className="font-bold text-ink-muted uppercase text-[10px]">Subject</span>
                <p className="font-semibold text-ink mt-0.5">{selectedInspectionEmail.subject}</p>
              </div>

              <div>
                <span className="font-bold text-ink-muted uppercase text-[10px]">Execution Timestamp</span>
                <p className="font-mono text-ink mt-0.5">
                  {new Date(selectedInspectionEmail.scheduledAt).toUTCString()}
                </p>
              </div>

              <div>
                <span className="font-bold text-ink-muted uppercase text-[10px]">BullMQ Job Identity</span>
                <p className="font-mono text-[11px] bg-canvas border border-border-soft p-2 rounded text-ink mt-0.5">
                  {selectedInspectionEmail.bullMqJobId || 'email-' + selectedInspectionEmail.id}
                </p>
              </div>

              {selectedInspectionEmail.etherealPreviewUrl && (
                <div className="mt-4 pt-4 border-t border-border-soft">
                  <a
                    href={selectedInspectionEmail.etherealPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-teal-50 border border-teal-200 text-status-ok font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors"
                  >
                    <MailCheck size={16} />
                    <span>View Sent Message in Ethereal</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
