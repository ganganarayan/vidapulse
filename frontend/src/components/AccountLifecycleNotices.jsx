'use strict';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';

/**
 * AccountLifecycleNotices
 *
 * Two post-login nudges tied to the 180-day account lifecycle:
 *   1. Returning-after-purge → a one-time blocking modal (must click OK).
 *   2. Returning free user after a 30+ day gap → a small reminder toast (once
 *      per browser session).
 *
 * Self-gating: renders nothing for logged-out visitors. Mounted once in App.
 */

const GAP_DAYS = 30;
const DAY_MS   = 24 * 60 * 60 * 1000;

export default function AccountLifecycleNotices() {
  const { user, updateUser } = useAuth();
  const { showToast }        = useToast();
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [acking, setAcking]                 = useState(false);

  // 1. Returning-after-purge — one-time modal.
  useEffect(() => {
    if (user && user.previously_purged_at && !user.purge_notice_shown) {
      setShowPurgeModal(true);
    }
  }, [user]);

  // 2. Returning free user after a gap — reminder toast, once per session.
  useEffect(() => {
    if (!user || user.plan !== 'free') return;
    if (!user.previous_login_at) return;                 // brand-new / first login
    if (sessionStorage.getItem('vp_gap_reminder')) return;
    const gap = Date.now() - new Date(user.previous_login_at).getTime();
    if (gap > GAP_DAYS * DAY_MS) {
      sessionStorage.setItem('vp_gap_reminder', '1');
      showToast('Log in at least once every 180 days to keep your account and all its data.');
    }
  }, [user, showToast]);

  async function ackPurge() {
    setAcking(true);
    try { await api.post('/user/purge-notice-ack'); } catch { /* non-fatal */ }
    updateUser({ purge_notice_shown: true });
    setShowPurgeModal(false);
    setAcking(false);
  }

  if (!showPurgeModal) return null;

  return (
    // No backdrop-dismiss — the user must click OK.
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-3">Welcome back — but some bad news</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Your previous account and <span className="text-red-300 font-medium">all of its data were destroyed</span> after
          more than <strong className="text-gray-100">180 days of inactivity</strong>. We sent reminders, but there was no
          login activity, so as per policy all your assets were removed.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed mt-3">
          You're now on a <strong className="text-gray-100">fresh free-forever account</strong>. Keep it alive by
          {' '}<strong className="text-gray-100">logging in at least once every 180 days</strong> to not lose any data.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            onClick={ackPurge}
            disabled={acking}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-gray-900 transition-colors disabled:opacity-60"
          >
            {acking ? 'Continuing…' : 'OK, got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
