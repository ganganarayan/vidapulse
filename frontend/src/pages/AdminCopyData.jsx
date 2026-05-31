'use strict';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminCopyData — /admin/copy-data
 *
 * Copies all videos + analytics from the admin account to any selected user.
 * Useful for seeding a test account with real data.
 */

const WHAT_GETS_COPIED = [
  { icon: '🎬', label: 'Videos',             desc: 'All active videos with title, source URL, thumbnail, duration' },
  { icon: '📊', label: 'Analytics sessions', desc: 'Every viewer session — geo, device, browser, UTM, watch time' },
  { icon: '⚡', label: 'Events',              desc: 'Play, pause, seek, complete events per session' },
  { icon: '📈', label: 'Watch intervals',     desc: 'Exact seconds watched per session (powers heatmap)' },
  { icon: '🔥', label: 'Heatmap data',        desc: 'Aggregated second-by-second engagement heatmap' },
  { icon: '📅', label: 'Daily stats',         desc: 'Per-day totals: views, plays, viewers, watch time' },
  { icon: '✨', label: 'AI Insights',          desc: 'Generated video insights and recommendations' },
  { icon: '💬', label: 'Viewer stories',      desc: 'Auto-generated viewer story summaries' },
  { icon: '⚙️', label: 'Player settings',     desc: 'Autoplay, mute, controls, colour per video' },
  { icon: '🔗', label: 'Embed configs',        desc: 'Domain restrictions and embed settings per video' },
];

const WHAT_NOT_COPIED = [
  'Payments & billing history',
  'Webhook configuration',
  'Funnels & conversion events',
  'Alerts & reports',
  'Allowed domains (account level)',
  'CTA links',
];

export default function AdminCopyData() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [users,     setUsers]     = useState([]);
  const [loadingU,  setLoadingU]  = useState(true);
  const [targetId,  setTargetId]  = useState('');
  const [copying,   setCopying]   = useState(false);
  const [result,    setResult]    = useState(null);  // { ok, videos_copied, log } | { error }
  const [confirmed, setConfirmed] = useState(false);

  const targetUser = users.find(u => u.id === targetId);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingU(true);
      const { data } = await api.get('/admin/users?page=1&limit=200');
      // Exclude the current admin from the list
      setUsers((data.users ?? []).filter(u => u.id !== user?.id));
    } catch {
      setUsers([]);
    } finally {
      setLoadingU(false);
    }
  }, [user?.id]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleCopy() {
    if (!targetUser || !confirmed) return;
    setCopying(true);
    setResult(null);
    try {
      const { data } = await api.post('/admin/copy-user-data', {
        source_email: user.email,
        target_email: targetUser.email,
      });
      setResult(data);
    } catch (err) {
      setResult({ error: err.response?.data?.error ?? 'Request failed' });
    } finally {
      setCopying(false);
      setConfirmed(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-gray-100">Copy Admin Data to User</h1>
            <p className="text-sm text-gray-400 mt-1">
              Seeds any user account with a full copy of your videos and analytics.
              Useful for demos and testing without waiting for real traffic.
            </p>
          </div>

          {/* Source */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Source account (you)</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-sm font-bold">
                  {(user?.name || user?.email || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">{user?.name || '—'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                {user?.plan_display_name ?? user?.plan}
              </span>
            </div>
          </div>

          {/* Target selector */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Target account</p>
            {loadingU ? (
              <div className="h-9 bg-gray-700/50 rounded-lg animate-pulse" />
            ) : (
              <select
                value={targetId}
                onChange={e => { setTargetId(e.target.value); setResult(null); setConfirmed(false); }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2
                           text-sm text-gray-200 focus:outline-none focus:border-amber-500
                           [color-scheme:dark]"
              >
                <option value="">— Select a user —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email} · {u.plan}
                  </option>
                ))}
              </select>
            )}

            {targetUser && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-700/40 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-200 text-xs font-bold">
                    {(targetUser.name || targetUser.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{targetUser.name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{targetUser.email}</p>
                </div>
                <span className="ml-auto flex-shrink-0 text-xs text-gray-500">{targetUser.plan}</span>
              </div>
            )}
          </div>

          {/* What gets copied */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">What will be copied</p>
            <div className="space-y-2.5">
              {WHAT_GETS_COPIED.map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 leading-tight mt-0.5">{item.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-200">{item.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Not copied</p>
              <div className="flex flex-wrap gap-2">
                {WHAT_NOT_COPIED.map(item => (
                  <span key={item} className="px-2 py-0.5 text-xs text-gray-500 bg-gray-700/40 rounded-full border border-gray-700/50">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm + Copy */}
          {targetUser && !result && (
            <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm text-amber-300">
                  I understand this will <strong>add</strong> copies of all admin videos and analytics
                  to <strong>{targetUser.email}</strong>. Existing data in that account will not be deleted.
                  This action cannot be undone.
                </span>
              </label>

              <button
                onClick={handleCopy}
                disabled={!confirmed || copying}
                className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                           flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           bg-amber-500 text-gray-900 hover:bg-amber-400"
              >
                {copying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    Copying… this may take a moment
                  </>
                ) : (
                  `Copy admin data → ${targetUser.name || targetUser.email}`
                )}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-5 border ${result.ok ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25'}`}>
              {result.ok ? (
                <>
                  <p className="text-sm font-bold text-emerald-300 mb-3">
                    ✓ Done — {result.videos_copied} video{result.videos_copied !== 1 ? 's' : ''} copied successfully
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {(result.log ?? []).map((line, i) => (
                      <p key={i} className="text-xs text-emerald-400/70 font-mono">{line}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => { setResult(null); setTargetId(''); setConfirmed(false); }}
                    className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition-colors underline"
                  >
                    Copy to another user
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-red-300 mb-2">✗ Failed</p>
                  <p className="text-xs text-red-400 font-mono">{result.error}</p>
                  {(result.log ?? []).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.log.map((line, i) => (
                        <p key={i} className="text-xs text-red-400/70 font-mono">{line}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline transition-colors"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
