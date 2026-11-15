import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BellRing, CheckCircle2, Send, Unlink, Sparkles } from 'lucide-react';

export const SlackSettings: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/integrations/slack/status', { withCredentials: true });
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Slack status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/integrations/slack/connect';
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestMsg(null);
    try {
      const res = await axios.post('/api/integrations/slack/test', {}, { withCredentials: true });
      setTestMsg(res.data);
    } catch (err: any) {
      setTestMsg({
        success: false,
        message: err.response?.data?.error || 'Failed to dispatch Slack test alert',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack? Alerts will cease.')) return;
    try {
      await axios.delete('/api/integrations/slack', { withCredentials: true });
      setStatus({ connected: false });
    } catch (err: any) {
      alert('Failed to disconnect Slack');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-[22px] font-extrabold text-ink tracking-tight flex items-center gap-2">
          <BellRing className="text-highlight" size={24} />
          <span>Slack Workspace Integration</span>
        </h1>
        <p className="text-[13px] text-ink-muted mt-1">
          Receive instantaneous, deduplicated alerts the moment a sender reaches its hourly quota.
        </p>
      </div>

      <div className="bg-white border border-border-card rounded-xl p-6 shadow-card flex flex-col gap-6">
        {status?.connected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between pb-5 border-b border-border-soft">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-status-ok font-bold">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-ink">{status.teamName}</h3>
                  <p className="text-[12px] text-ink-muted">
                    Channel: <strong className="text-ink">{status.channelName || '#outreach-alerts'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="text-[12px] font-bold text-ink-muted hover:text-status-error flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Unlink size={15} />
                <span>Disconnect</span>
              </button>
            </div>

            {/* Notification Policy Card */}
            <div className="bg-canvas border border-border-soft rounded-lg p-4 text-[13px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink font-bold">
                <Sparkles size={16} className="text-highlight" />
                <span>Active Notification Trigger Rules</span>
              </div>
              <ul className="list-disc list-inside text-ink-muted text-[12px] flex flex-col gap-1 pl-1">
                <li>
                  <strong className="text-ink">Hourly Limit Trigger:</strong> Automatically fires when a sender uses 100% of their hourly quota.
                </li>
                <li>
                  <strong className="text-ink">Zero-Spam Deduplication:</strong> Exactly 1 notification per sender per UTC hour window is sent.
                </li>
              </ul>
            </div>

            {testMsg && (
              <div
                className={`p-3 rounded-lg border text-[13px] font-medium ${
                  testMsg.success
                    ? 'bg-teal-50 border-teal-200 text-status-ok'
                    : 'bg-red-50 border-red-200 text-status-error'
                }`}
              >
                {testMsg.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="bg-highlight hover:bg-highlight-hover text-white font-bold text-[13px] px-5 py-2.5 rounded-lg shadow-highlight flex items-center gap-2 transition-all"
              >
                <Send size={15} />
                <span>{isSendingTest ? 'Sending Verification...' : 'Send Test Slack Alert'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-canvas border border-border-soft flex items-center justify-center text-highlight shadow-sm">
              <BellRing size={28} />
            </div>
            <div className="max-w-md">
              <h3 className="font-extrabold text-[18px] text-ink">Connect Your Slack Workspace</h3>
              <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed">
                Empower your outbound team with real-time alerts. When senders approach their rate limit or experience socket timeouts, PulseSend dispatches instant notifications.
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="mt-2 bg-ink hover:bg-ink-sidebar text-white font-bold text-[13px] px-6 py-3 rounded-xl shadow-md flex items-center gap-2.5 transition-all"
            >
              <span>Connect Slack (OAuth v2)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
