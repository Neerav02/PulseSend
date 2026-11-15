import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, ExternalLink, MailCheck, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const Sent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [emails, setEmails] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [searchSource, setSearchSource] = useState<string>('database');

  const fetchSentEmails = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim().length > 0) {
        // Query Elasticsearch Search endpoint
        const res = await axios.get(
          `/api/emails/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=15`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          setEmails(res.data.data);
          setPagination({ total: res.data.total, pages: res.data.pages });
          setSearchSource(res.data.source);
        }
      } else {
        const res = await axios.get(`/api/emails/sent?page=${page}&limit=15`, {
          withCredentials: true,
        });
        if (res.data?.success) {
          setEmails(res.data.data);
          setPagination(res.data.pagination);
          setSearchSource('database');
        }
      }
    } catch (err) {
      console.error('Failed to load sent archive', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentEmails();
  }, [page, searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Send className="text-highlight" size={24} />
            <span>Sent Emails Archive</span>
          </h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Complete audit trail with full-text search and live Ethereal SMTP delivery proofs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by recipient, subject, or body..."
            className="w-full bg-white border border-border-soft rounded-lg pl-10 pr-4 py-2 text-[13px] text-ink focus:outline-none focus:border-highlight"
          />
        </div>
      </div>

      {searchQuery && (
        <div className="text-[12px] text-ink-muted font-medium bg-canvas border border-border-soft px-3 py-1.5 rounded-lg flex items-center justify-between">
          <span>
            Showing search results for: <strong className="text-ink">"{searchQuery}"</strong> ({pagination.total} found)
          </span>
          <span className="font-mono text-[11px] bg-white border border-border-soft px-2 py-0.5 rounded">
            Engine: {searchSource}
          </span>
        </div>
      )}

      <div className="bg-white border border-border-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas border-b border-border-soft text-ink-muted text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-5">Recipient</th>
                <th className="py-3 px-5">Subject Line</th>
                <th className="py-3 px-5">Dispatched By</th>
                <th className="py-3 px-5">Delivered At (UTC)</th>
                <th className="py-3 px-5 text-right">Ethereal Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {emails.length > 0 ? (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink">{email.recipientEmail}</td>
                    <td className="py-3.5 px-5 text-ink-muted truncate max-w-sm">{email.subject}</td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-ink-muted">
                      {email.senderEmail || email.sender?.email || 'outreach@pulsesend.io'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[12px] text-ink">
                      {email.sentAt ? new Date(email.sentAt).toUTCString().slice(5, 25) : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {email.etherealPreviewUrl ? (
                        <a
                          href={email.etherealPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-status-ok bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-md transition-colors"
                        >
                          <MailCheck size={14} />
                          <span>View Message</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[12px] text-ink-subtle italic">No preview URL</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-muted text-[13px]">
                    No dispatched emails found in archive.
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
