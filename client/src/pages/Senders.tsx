import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users2, Plus, Mail, Send } from 'lucide-react';

export const Senders: React.FC = () => {
  const [senders, setSenders] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState(50);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(
    null
  );

  const fetchSenders = async () => {
    try {
      const res = await axios.get('/api/senders', { withCredentials: true });
      if (res.data?.success) {
        setSenders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load senders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenders();
  }, []);

  const handleCreateSender = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/senders',
        {
          displayName,
          email,
          smtpUser: smtpUser || email,
          smtpPassword: smtpPassword || 'password',
          hourlyLimit: Number(hourlyLimit),
        },
        { withCredentials: true }
      );
      setIsAdding(false);
      setDisplayName('');
      setEmail('');
      setSmtpUser('');
      setSmtpPassword('');
      fetchSenders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add sender mailbox');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await axios.post(`/api/senders/${id}/test`, {}, { withCredentials: true });
      setTestResult({ id, success: true, msg: res.data.message });
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        msg: err.response?.data?.error || 'SMTP Connection Test Failed',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Users2 className="text-highlight" size={24} />
            <span>Sender Mailboxes & Hourly Quotas</span>
          </h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Configure isolated sender mailboxes with dedicated SMTP credentials and hourly rate limits.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-highlight hover:bg-highlight-hover text-white font-bold text-[13px] px-4 py-2 rounded-lg shadow-highlight flex items-center gap-2 transition-all"
        >
          <Plus size={16} />
          <span>{isAdding ? 'Close Form' : 'Add Sender Mailbox'}</span>
        </button>
      </div>

      {/* Add Sender Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateSender}
          className="bg-white border border-border-card rounded-xl p-6 shadow-card flex flex-col gap-4 animate-in fade-in"
        >
          <h3 className="font-bold text-[15px] text-ink">Add Outbound Mailbox</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-ink-muted uppercase">Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Team"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-canvas border border-border-soft rounded-lg px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-highlight"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-ink-muted uppercase">Sender Email</label>
              <input
                type="email"
                required
                placeholder="sales@reachinbox.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-canvas border border-border-soft rounded-lg px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-highlight"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-ink-muted uppercase">SMTP User</label>
              <input
                type="text"
                required
                placeholder="SMTP User (or ethereal auto-user)"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="bg-canvas border border-border-soft rounded-lg px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-highlight"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-ink-muted uppercase">SMTP Password</label>
              <input
                type="password"
                required
                placeholder="Password (Encrypted with AES-256-GCM)"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="bg-canvas border border-border-soft rounded-lg px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-highlight"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-ink-muted uppercase">
                Hourly Limit (Emails / UTC Hour)
              </label>
              <input
                type="number"
                min="1"
                required
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10))}
                className="bg-canvas border border-border-soft rounded-lg px-3 py-2 text-[13px] text-ink font-mono focus:outline-none focus:border-highlight"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[13px] font-bold text-ink-muted px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-ink hover:bg-ink-sidebar text-white font-bold text-[13px] px-5 py-2 rounded-lg"
            >
              Save Mailbox
            </button>
          </div>
        </form>
      )}

      {/* Senders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {senders.map((sender) => (
          <div
            key={sender.id}
            className="bg-white border border-border-card rounded-xl p-5 shadow-card flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-canvas flex items-center justify-center text-highlight font-bold">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-ink">{sender.displayName}</h3>
                    <p className="font-mono text-[12px] text-ink-muted">{sender.email}</p>
                  </div>
                </div>

                <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded bg-canvas border border-border-soft">
                  {sender.hourlyLimit} / hr
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border-soft flex justify-between text-[12px]">
                <span className="text-ink-muted">Consumption this hour:</span>
                <span className="font-mono font-bold text-ink">
                  {sender.currentHourSent} sent ({sender.remaining} slots remaining)
                </span>
              </div>
            </div>

            {testResult && testResult.id === sender.id && (
              <div
                className={`text-[12px] p-2.5 rounded-lg border font-medium ${
                  testResult.success
                    ? 'bg-teal-50 border-teal-200 text-status-ok'
                    : 'bg-red-50 border-red-200 text-status-error'
                }`}
              >
                {testResult.msg}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border-soft">
              <button
                onClick={() => handleTestConnection(sender.id)}
                disabled={testingId === sender.id}
                className="text-[12px] font-bold text-ink hover:text-highlight transition-colors bg-canvas hover:bg-white border border-border-soft px-3 py-1.5 rounded-md flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>{testingId === sender.id ? 'Testing Handshake...' : 'Test SMTP Connection'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
