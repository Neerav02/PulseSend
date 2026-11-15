import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, RefreshCw, Trash2 } from 'lucide-react';
import { CountdownBadge } from '../components/CountdownBadge';

export const Scheduled: React.FC = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page] = useState(1);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const url = `/api/emails/scheduled?page=${page}&limit=15${
        statusFilter ? `&status=${statusFilter}` : ''
      }`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.data?.success) {
        setEmails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load scheduled emails', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, [page, statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      await axios.delete(`/api/emails/${id}`, { withCredentials: true });
      fetchScheduled();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel email');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Clock className="text-highlight" size={24} />
            <span>Scheduled Outreach Queue</span>
          </h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Real-time delayed jobs in BullMQ. Automatically recovered after server or Redis reboots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-border-soft rounded-lg px-3 py-2 text-[12px] font-semibold text-ink focus:outline-none focus:border-highlight"
          >
            <option value="">All Active Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="RATE_LIMITED_DEFERRED">RATE_LIMITED_DEFERRED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="RETRY_PENDING">RETRY_PENDING</option>
          </select>

          <button
            onClick={fetchScheduled}
            className="p-2 bg-white border border-border-soft rounded-lg text-ink-muted hover:text-ink transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-border-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas border-b border-border-soft text-ink-muted text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-5">Countdown</th>
                <th className="py-3 px-5">Recipient</th>
                <th className="py-3 px-5">Subject Line</th>
                <th className="py-3 px-5">Sender</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {emails.length > 0 ? (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <CountdownBadge targetDate={email.scheduledAt} status={email.status} />
                    </td>
                    <td className="py-3.5 px-5 font-bold text-ink">{email.recipientEmail}</td>
                    <td className="py-3.5 px-5 text-ink-muted truncate max-w-sm">{email.subject}</td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-ink-muted">
                      {email.sender?.email}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-canvas border border-border-soft">
                        {email.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleCancel(email.id)}
                        className="p-1.5 rounded text-ink-muted hover:text-status-error hover:bg-red-50 transition-colors"
                        title="Cancel job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted text-[13px]">
                    No scheduled outreach emails found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
