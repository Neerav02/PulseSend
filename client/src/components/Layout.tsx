import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Send,
  Users2,
  BellRing,
  ExternalLink,
  Search,
  LogOut,
} from 'lucide-react';
import { BrandSymbol } from './BrandSymbol';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink">
      {/* 30% Structural Midnight Ink Sidebar */}
      <aside className="w-64 bg-ink-sidebar text-white flex flex-col flex-shrink-0 border-r border-white/10 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <BrandSymbol size={30} showWordmark />
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex flex-col gap-1.5 flex-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-ink-subtle hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard size={17} />
            <span>Flight Deck</span>
          </NavLink>

          <NavLink
            to="/scheduled"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-ink-subtle hover:text-white hover:bg-white/5'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Clock size={17} />
              <span>Scheduled Queue</span>
            </div>
            <span className="bg-highlight text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live
            </span>
          </NavLink>

          <NavLink
            to="/sent"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-ink-subtle hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Send size={17} />
            <span>Sent Archive</span>
          </NavLink>

          <NavLink
            to="/senders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-ink-subtle hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Users2 size={17} />
            <span>Senders & Quotas</span>
          </NavLink>

          <NavLink
            to="/settings/slack"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-ink-subtle hover:text-white hover:bg-white/5'
              }`
            }
          >
            <BellRing size={17} />
            <span>Slack Alerts</span>
          </NavLink>

          <div className="my-3 border-t border-white/10" />

          {/* External Bull Board Queue Monitor */}
          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold text-ink-subtle hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span>Bull Board GUI</span>
            </div>
            <ExternalLink size={14} />
          </a>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'NB'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-[12px] font-bold text-white truncate">{user?.name || 'Neerav Babel'}</span>
              <span className="text-[10px] text-ink-subtle truncate">{user?.email || 'admin@outboxlabs.com'}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-ink-subtle hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border-soft flex items-center justify-between px-8 sticky top-0 z-20">
          {/* Elasticsearch Search Bar */}
          <div className="relative w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <input
              type="text"
              placeholder="Search 12,840 outbound emails (Elasticsearch)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value;
                  navigate(`/sent?search=${encodeURIComponent(q)}`);
                }
              }}
              className="w-full bg-canvas border border-border-soft rounded-lg pl-10 pr-10 py-1.5 text-[13px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-highlight focus:bg-white transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-white border border-border-soft text-[10px] text-ink-muted px-1.5 py-0.5 rounded font-mono">
              /
            </kbd>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-canvas border border-border-soft px-3 py-1.5 rounded-full text-[12px] font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-status-ok shadow-[0_0_8px_rgba(13,148,136,0.5)]"></span>
              <span>Slack Live Stream Active</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

