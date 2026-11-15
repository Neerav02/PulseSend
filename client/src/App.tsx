import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scheduled } from './pages/Scheduled';
import { Sent } from './pages/Sent';
import { Senders } from './pages/Senders';
import { SlackSettings } from './pages/SlackSettings';
import { Login } from './pages/Login';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] font-bold text-ink-muted">Booting PulseSend...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Main Application Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="scheduled" element={<Scheduled />} />
        <Route path="sent" element={<Sent />} />
        <Route path="senders" element={<Senders />} />
        <Route path="settings/slack" element={<SlackSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
