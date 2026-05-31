import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatINR(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

function formatUSD(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminRevenue() {
  const navigate = useNavigate();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data: res } = await api.get('/admin/revenue');
      setData(res);
    } catch (err) {
      setFetchError(err.response?.data?.message ?? 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-amber-500 text-xl font-bold select-none">{'▶︎'}</span>
            <span className="text-white font-semibold">VidaPulse</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-300">Revenue</span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="text-gray-400 text-sm mt-1">
            Payment breakdown from Razorpay captured transactions.
          </p>
        </div>

        {/* Grand total card */}
        <div className="mb-8">
          {loading ? (
            <div className="animate-pulse h-24 bg-gray-800 rounded-xl border border-gray-700" />
          ) : data ? (
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/10 border border-amber-600/30 rounded-xl px-6 py-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Revenue (INR)</p>
                <p className="text-3xl font-bold text-amber-400 mt-0.5">
                  {formatINR(data.grand_total_inr)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  From {data.users.length} paying customer{data.users.length !== 1 ? 's' : ''} · INR transactions only
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm mb-6">
            {fetchError}
          </div>
        )}

        {/* Revenue table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Last Payment</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Last Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-gray-700 rounded" />
                            <div className="h-2.5 w-36 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-3 w-16 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 w-20 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-700 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : !data || data.users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No captured payments found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.users.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-700/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-300 text-xs font-bold">
                              {(user.name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate text-sm">
                              {user.name || <span className="text-gray-500 italic">No name</span>}
                            </p>
                            <p className="text-gray-400 text-xs truncate">{user.email}</p>
                          </div>
                          <span className="ml-2 text-gray-400 text-xs flex-shrink-0">
                            ×{user.payment_count}
                          </span>
                        </div>
                      </td>

                      {/* Last payment amount */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {user.last_amount != null ? (
                          <span className="text-gray-200 font-medium">
                            {user.last_currency === 'USD'
                              ? formatUSD(user.last_amount)
                              : formatINR(user.last_amount)
                            }
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>

                      {/* Last payment date */}
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                        {formatDate(user.last_payment_at)}
                      </td>

                      {/* Total paid */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          {user.total_inr > 0 && (
                            <span className="text-green-400 font-semibold text-sm">
                              {formatINR(user.total_inr)}
                            </span>
                          )}
                          {user.total_usd > 0 && (
                            <span className="text-blue-400 font-semibold text-sm">
                              {formatUSD(user.total_usd)}
                            </span>
                          )}
                          {user.total_inr === 0 && user.total_usd === 0 && (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          {data && data.users.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
              <span>{data.users.length} customer{data.users.length !== 1 ? 's' : ''}</span>
              <span>Captured Razorpay payments only · Grand total in INR</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
