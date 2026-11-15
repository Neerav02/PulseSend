import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Clock, Gauge, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { CsvUploader } from './CsvUploader';

interface Sender {
  id: string;
  email: string;
  displayName: string;
  hourlyLimit: number;
  remaining: number;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [recipientMode, setRecipientMode] = useState<'csv' | 'manual'>('csv');
  const [manualRecipientsText, setManualRecipientsText] = useState('');
  const [parsedRecipients, setParsedRecipients] = useState<{ email: string; name?: string }[]>([]);

  const [subject, setSubject] = useState('');
  const [bodyContent, setBodyContent] = useState('');

  // Default to 5 minutes from now
  const defaultDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);
  const [scheduledAt, setScheduledAt] = useState(defaultDate);
  const [minDelaySeconds, setMinDelaySeconds] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      axios
        .get('/api/senders', { withCredentials: true })
        .then((res) => {
          if (res.data?.success && res.data.data.length > 0) {
            setSenders(res.data.data);
            setSelectedSenderId(res.data.data[0].id);
          }
        })
        .catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active recipient list
  const activeRecipients =
    recipientMode === 'csv'
      ? parsedRecipients
      : manualRecipientsText
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        .map((email) => ({ email }));

  // Live Dispatch Velocity Forecast Calculation
  const totalLeads = activeRecipients.length;
  const totalDurationSeconds = Math.max(0, (totalLeads - 1) * minDelaySeconds);
  const durationMinutes = Math.floor(totalDurationSeconds / 60);
  const durationSecRemainder = totalDurationSeconds % 60;
  const selectedSender = senders.find((s) => s.id === selectedSenderId);
  const willExceedQuota =
    selectedSender && selectedSender.remaining > 0 && totalLeads > selectedSender.remaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSenderId) {
      setErrorMessage('Please select an active sender mailbox.');
      return;
    }

    if (activeRecipients.length === 0) {
      setErrorMessage('Please provide at least one valid recipient email.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Subject line cannot be blank.');
      return;
    }

    if (!bodyContent.trim()) {
      setErrorMessage('Email body cannot be blank.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(
        '/api/emails/schedule',
        {
          senderId: selectedSenderId,
          subject,
          bodyContent,
          recipients: activeRecipients,
          scheduledAt: new Date(scheduledAt).toISOString(),
          minDelaySeconds,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-sidebar/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-border-card rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-highlight flex items-center justify-center text-white shadow-sm shadow-highlight/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Outreach Flight Deck</h2>
              <p className="text-[11px] text-ink-muted">Configure zero-cron persistent delayed scheduling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-status-error text-[12px] font-semibold px-4 py-2.5 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Top Row: Sender Selection & Recipient Mode */}
          <div className="grid grid-cols-2 gap-5">
            {/* Sender Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-ink uppercase tracking-wider">
                Assigned Sender Mailbox
              </label>
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="bg-canvas border border-border-soft rounded-lg px-3.5 py-2.5 text-[13px] font-semibold text-ink focus:outline-none focus:border-highlight"
              >
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email} ({s.remaining} / {s.hourlyLimit} slots available this hour)
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Source Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-ink uppercase tracking-wider">
                Recipient Ingestion Mode
              </label>
              <div className="flex bg-canvas p-1 rounded-lg border border-border-soft">
                <button
                  type="button"
                  onClick={() => setRecipientMode('csv')}
                  className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${recipientMode === 'csv'
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                    }`}
                >
                  CSV / File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('manual')}
                  className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${recipientMode === 'manual'
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                    }`}
                >
                  Manual Text Entry
                </button>
              </div>
            </div>
          </div>

          {/* Recipient Input Area */}
          <div>
            {recipientMode === 'csv' ? (
              <CsvUploader onRecipientsParsed={setParsedRecipients} />
            ) : (
              <div className="flex flex-col gap-1.5">
                <textarea
                  rows={3}
                  value={manualRecipientsText}
                  onChange={(e) => setManualRecipientsText(e.target.value)}
                  placeholder="alex@stripe.com, sarah@datadog.com&#10;One email per line or comma-separated"
                  className="w-full bg-canvas border border-border-soft rounded-lg p-3 text-[13px] font-mono placeholder:text-ink-subtle focus:outline-none focus:border-highlight"
                />
                <span className="text-[11px] text-ink-muted">
                  Detected {activeRecipients.length} valid email address(es).
                </span>
              </div>
            )}
          </div>

          {/* Subject Line */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-ink uppercase tracking-wider">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question regarding cold email deliverability"
              className="bg-canvas border border-border-soft rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-ink focus:outline-none focus:border-highlight"
            />
          </div>

          {/* Email Body Editor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-ink uppercase tracking-wider">
              Email Body (HTML / Text)
            </label>
            <textarea
              rows={5}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Hi {{name}},&#10;&#10;I noticed your team was exploring high-volume outreach automation..."
              className="w-full bg-canvas border border-border-soft rounded-lg p-3 text-[13px] text-ink focus:outline-none focus:border-highlight font-sans leading-relaxed"
            />
          </div>

          {/* Scheduling & Throttling Cockpit */}
          <div className="bg-canvas border border-border-soft rounded-xl p-4.5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-ink font-bold text-[13px]">
              <Clock size={16} className="text-highlight" />
              <span>Intelligent Throttling & Dispatch Timing</span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Start Date Time Picker */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-ink-muted uppercase">
                  First Email Start Time (UTC / Local)
                </span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="bg-white border border-border-soft rounded-lg px-3 py-2 text-[12px] font-mono text-ink focus:outline-none focus:border-highlight"
                />
              </div>

              {/* Minimum Delay Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-ink-muted uppercase">Minimum Send Interval</span>
                  <span className="text-highlight font-mono">{minDelaySeconds} seconds</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={minDelaySeconds}
                  onChange={(e) => setMinDelaySeconds(parseInt(e.target.value, 10))}
                  className="accent-highlight cursor-pointer"
                />
                <span className="text-[10px] text-ink-subtle">
                  Prevents burst delivery penalties across concurrent workers.
                </span>
              </div>
            </div>

            {/* Live Dispatch Velocity Forecast Card */}
            <div className="bg-white border border-border-card rounded-lg p-3 text-[12px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-highlight" />
                <span className="text-ink font-semibold">
                  Forecast:{' '}
                  <span className="text-ink-muted font-normal">
                    {totalLeads} emails will dispatch over{' '}
                    <strong className="text-ink">
                      {durationMinutes}m {durationSecRemainder}s
                    </strong>
                    .
                  </span>
                </span>
              </div>
              {willExceedQuota ? (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Auto-deferral will activate for {totalLeads - (selectedSender?.remaining || 0)} leads
                </span>
              ) : (
                <span className="text-[11px] font-bold text-status-ok bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Within Hourly Quota
                </span>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-bold text-ink-muted hover:text-ink px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalLeads === 0}
              className="group relative bg-[#FF5733] hover:bg-[#E84A26] active:bg-[#D43F1E] disabled:opacity-50 text-white font-bold text-[13px] px-6 py-2.5 rounded-lg border border-[#D94220] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(18,22,31,0.12)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_5px_rgba(18,22,31,0.16)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] flex items-center gap-2 transition-all duration-150 transform hover:-translate-y-[0.5px] active:translate-y-[0.5px]"
            >
              <Send size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>{isSubmitting ? 'Scheduling...' : `Schedule ${totalLeads} Emails`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
