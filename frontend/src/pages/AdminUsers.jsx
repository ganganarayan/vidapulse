import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * AdminUsers — /admin/users
 *
 * Paginated list of all subscriber accounts.
 * Admins can:
 *   - Search by name or email
 *   - Click "Enter Account" to start an impersonation session
 *   - View the impersonation audit log
 *
 * Impersonation flow:
 *   1. Admin clicks "Enter Account" → confirmation modal opens
 *   2. Admin enters a reason (required) and confirms
 *   3. POST /api/admin/impersonate/:userId → backend returns impersonation JWT
 *   4. startImpersonation(token, targetUser) stores token + loads subscriber data
 *   5. Window navigates to /dashboard (now viewed as the subscriber)
 *   6. ImpersonationBanner shows at top of every page
 */

const PLAN_COLORS = {
  free          : 'bg-gray-600 text-gray-200',
  starter       : 'bg-blue-700 text-blue-100',
  pro           : 'bg-amber-600 text-amber-100',
  admin_lifetime: 'bg-purple-700 text-purple-100',
};

function PlanChip({ plan }) {
  const cls = PLAN_COLORS[plan] ?? 'bg-gray-600 text-gray-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {plan?.replace('_', ' ') ?? '—'}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Build a display label for a user's signup lead source from the stored UTM
// fields. Mapping: campaign = utm_campaign, ad set = utm_term, ad = utm_content.
// Returns null when no UTM params were captured (i.e. a direct signup).
function formatLeadSource(user) {
  const path = [user.signup_utm_campaign, user.signup_utm_term, user.signup_utm_content]
    .map(v => (v && String(v).trim()) || null)
    .filter(Boolean);
  const src = (user.signup_utm_source && String(user.signup_utm_source).trim()) || null;
  const med = (user.signup_utm_medium && String(user.signup_utm_medium).trim()) || null;
  if (path.length === 0 && !src && !med) return null;
  return {
    primary  : path.length ? path.join(' / ') : (src || med),
    secondary: [src, med].filter(Boolean).join(' · ') || null,
  };
}

// Whole days since a timestamp (e.g. account creation → the "DAYS" column).
function daysSince(iso) {
  if (!iso) return '—';
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function formatRelative(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  // Under 24 hours → relative ("so many minutes/hours ago")
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  // 24 hours or more → absolute date + time
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation modal — shown before starting an impersonation session
// ─────────────────────────────────────────────────────────────────────────────

function ImpersonateModal({ targetUser, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const reasonRef = useRef(null);

  useEffect(() => {
    setTimeout(() => reasonRef.current?.focus(), 50);
  }, []);

  const valid = reason.trim().length >= 3;

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid || loading) return;
    onConfirm(reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Enter Account</h2>
            <p className="text-gray-400 text-sm mt-1">
              You are about to view VidaPulse as this user. All actions will be logged.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300 ml-4 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Target user card */}
        <div className="mx-6 mb-4 p-3 bg-gray-700/60 border border-gray-600 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {(targetUser.name || targetUser.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {targetUser.name || '(no name)'}
              </p>
              <p className="text-gray-400 text-xs truncate">{targetUser.email}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <PlanChip plan={targetUser.plan} />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <label className="block text-sm text-gray-300 mb-1.5">
            Reason <span className="text-red-400">*</span>
            <span className="text-gray-500 ml-1 font-normal">(required for audit log)</span>
          </label>
          <textarea
            ref={reasonRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer support request #12345 — user cannot see their analytics"
            rows={3}
            maxLength={500}
            className="
              w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2
              text-white text-sm placeholder-gray-500
              focus:outline-none focus:border-amber-500
              resize-none
            "
          />
          <p className="text-gray-500 text-xs mt-1 text-right">{reason.length}/500</p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || loading}
              className="
                flex-1 px-4 py-2 rounded-lg text-sm font-semibold
                bg-red-600 text-white hover:bg-red-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entering…
                </>
              ) : (
                'Enter Account'
              )}
            </button>
          </div>

          {/* Security note */}
          <p className="mt-3 text-xs text-gray-500 text-center">
            This session will expire in 2 hours and will be visible to the account owner.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PromoModal — manage per-user promotion video visibility
// ─────────────────────────────────────────────────────────────────────────────

const VISIBILITY_INFO = {
  noshow : { label: 'Admin only',  cls: 'text-gray-500'  },
  free   : { label: 'All users',   cls: 'text-green-400' },
  starter: { label: 'Starter+',    cls: 'text-blue-400'  },
  pro    : { label: 'Pro only',    cls: 'text-amber-400' },
};

function PromoModal({ targetUser, onClose }) {
  const [promos,    setPromos]    = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(new Set()); // promoIds currently in-flight

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [promosRes, hiddenRes] = await Promise.all([
          api.get('/admin/promotion-videos'),
          api.get(`/admin/users/${targetUser.id}/promo-hidden`),
        ]);
        setPromos(promosRes.data.videos ?? []);
        setHiddenIds(new Set(hiddenRes.data.hidden_ids ?? []));
      } catch (_) {
        /* errors shown as empty state below */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetUser.id]);

  async function handleToggle(promoId, currentlyHidden) {
    if (toggling.has(promoId)) return;
    setToggling(prev => new Set([...prev, promoId]));
    const newHidden = !currentlyHidden;
    try {
      await api.patch(`/admin/users/${targetUser.id}/promo-hidden`, {
        promotion_video_id: promoId,
        hidden: newHidden,
      });
      setHiddenIds(prev => {
        const next = new Set(prev);
        if (newHidden) next.add(promoId);
        else next.delete(promoId);
        return next;
      });
    } catch (_) {
      /* silent — toggle snaps back via state not changing */
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(promoId); return next; });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Promotion Visibility</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Control which featured videos are visible to{' '}
              <span className="text-white font-medium">{targetUser.name || targetUser.email}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 ml-4 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : promos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No promotion videos have been added yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {promos.map(promo => {
                const isHidden  = hiddenIds.has(promo.id);
                const isBusy    = toggling.has(promo.id);
                const visInfo   = VISIBILITY_INFO[promo.visibility] ?? VISIBILITY_INFO.noshow;

                return (
                  <div
                    key={promo.id}
                    className="flex items-center gap-3 p-3 bg-gray-700/40 border border-gray-700 rounded-lg"
                  >
                    {/* Thumbnail */}
                    {promo.thumbnail_url ? (
                      <img
                        src={promo.thumbnail_url}
                        alt=""
                        className="w-14 h-9 rounded object-cover flex-shrink-0 bg-gray-700"
                      />
                    ) : (
                      <div className="w-14 h-9 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor"
                          strokeWidth={1.5} viewBox="0 0 24 24">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      </div>
                    )}

                    {/* Title + visibility tier */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{promo.title}</p>
                      <p className={`text-xs mt-0.5 ${visInfo.cls}`}>{visInfo.label}</p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(promo.id, isHidden)}
                      disabled={isBusy}
                      title={isHidden ? 'Click to show for this user' : 'Click to hide for this user'}
                      className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                        !isHidden ? 'bg-green-600' : 'bg-gray-600'
                      } ${isBusy ? 'opacity-60' : 'hover:opacity-90'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                          !isHidden ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>

                    {/* Label */}
                    <span className={`text-xs w-12 text-right flex-shrink-0 ${isHidden ? 'text-gray-500' : 'text-green-400'}`}>
                      {isBusy ? '…' : isHidden ? 'Hidden' : 'Visible'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            Toggle off to hide a featured video for this user only.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-400 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserRow — table row with inline plan select + date input (auto-save)
// ─────────────────────────────────────────────────────────────────────────────

function isoToDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
}

function UserRow({ user, onPlanUpdate, onPromoClick, onEnterClick, selected, onToggleSelect, selectable }) {
  const [planVal,      setPlanVal]      = useState(user.plan ?? 'free');
  const [dateVal,      setDateVal]      = useState(isoToDateInput(user.plan_expires_at));
  const [saving,       setSaving]       = useState(false);
  const [saveErr,      setSaveErr]      = useState('');
  const [saved,        setSaved]        = useState(false);   // brief ✓ flash
  const [awaitingDate, setAwaitingDate] = useState(false);   // starter/pro selected, date not yet set
  const prevDateRef = useRef(isoToDateInput(user.plan_expires_at));

  // Keep local state in sync when parent re-fetches users
  useEffect(() => {
    setPlanVal(user.plan ?? 'free');
    const d = isoToDateInput(user.plan_expires_at);
    setDateVal(d);
    prevDateRef.current = d;
    setAwaitingDate(false);
  }, [user.plan, user.plan_expires_at]);

  const neverExpires = planVal === 'free' || planVal === 'admin_lifetime';
  const needsDate    = planVal === 'starter' || planVal === 'pro';

  async function persist(newPlan, newDate) {
    setSaving(true);
    setSaveErr('');
    setSaved(false);
    setAwaitingDate(false);
    try {
      const body = {
        plan      : newPlan,
        expires_at: (newPlan === 'free' || newPlan === 'admin_lifetime')
          ? null
          : (newDate ? new Date(newDate).toISOString() : null),
      };
      const { data } = await api.patch(`/admin/users/${user.id}/plan`, body);
      onPlanUpdate(user.id, {
        plan             : data.plan,
        plan_display_name: data.plan_display_name,
        plan_expires_at  : data.expires_at,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveErr(err.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handlePlanChange(e) {
    const val = e.target.value;
    setPlanVal(val);
    setSaveErr('');
    if (val === 'free' || val === 'admin_lifetime') {
      // No date needed — save immediately and clear any pending date
      setDateVal('');
      setAwaitingDate(false);
      persist(val, '');
    } else {
      // starter / pro — wait for a date before saving
      setAwaitingDate(true);
    }
  }

  function handleDateChange(e) {
    setDateVal(e.target.value);
  }

  function handleDateBlur() {
    if (!dateVal) return; // no date entered yet — keep waiting
    if (needsDate && awaitingDate) {
      // Date just provided after plan change — now save both together
      prevDateRef.current = dateVal;
      persist(planVal, dateVal);
    } else if (dateVal !== prevDateRef.current) {
      // Date changed on existing paid plan — save
      prevDateRef.current = dateVal;
      persist(planVal, dateVal);
    }
  }

  return (
    <tr className={`transition-colors ${selected ? 'bg-amber-500/5' : 'hover:bg-gray-700/30'}`}>

      {/* Select */}
      <td className="px-4 py-3 w-px">
        <input
          type="checkbox"
          checked={!!selected}
          disabled={!selectable}
          onChange={() => onToggleSelect(user.id)}
          title={selectable ? 'Select user' : 'Admin accounts cannot be deleted'}
          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500
                     focus:ring-amber-500/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed accent-amber-500"
        />
      </td>

      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-200 text-xs font-bold">
              {(user.name || user.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium truncate">
              {user.name || <span className="text-gray-500 italic">No name</span>}
            </p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
          {!user.is_active && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-900/60 text-red-400 text-xs rounded flex-shrink-0">
              Deactivated
            </span>
          )}
        </div>
      </td>

      {/* Plan — inline select */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <select
            value={planVal}
            onChange={handlePlanChange}
            disabled={saving}
            className="
              bg-gray-700 border border-gray-600 rounded px-2 py-1
              text-xs text-white font-semibold uppercase tracking-wide
              focus:outline-none focus:border-amber-500
              disabled:opacity-60 cursor-pointer
            "
          >
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="admin_lifetime">Admin Lifetime</option>
          </select>
          {saving && (
            <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {saved && !saving && (
            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        {awaitingDate && !saveErr && (
          <p className="text-amber-400 text-xs mt-0.5">← set expiry date to save</p>
        )}
        {saveErr && <p className="text-red-400 text-xs mt-0.5 max-w-[120px] truncate" title={saveErr}>{saveErr}</p>}
      </td>

      {/* Plan Expires — inline date input */}
      <td className="px-4 py-3 hidden lg:table-cell">
        {neverExpires ? (
          <span className="text-green-400 text-xs font-medium">Forever</span>
        ) : (
          <input
            type="date"
            value={dateVal}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
            disabled={saving}
            className={`
              bg-gray-700 rounded px-2 py-1
              text-xs text-white focus:outline-none
              disabled:opacity-60 cursor-pointer
              [color-scheme:dark]
              ${awaitingDate
                ? 'border-2 border-amber-400 animate-pulse'
                : 'border border-gray-600 focus:border-amber-500'
              }
            `}
          />
        )}
      </td>

      {/* Videos */}
      <td className="px-4 py-3 hidden sm:table-cell text-gray-300 text-xs">
        {user.video_count}
      </td>

      {/* DAYS — days since account creation */}
      <td className="px-4 py-3 hidden sm:table-cell text-gray-300 text-xs tabular-nums">
        {daysSince(user.created_at)}
      </td>

      {/* Last Login */}
      <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
        {formatRelative(user.last_login_at)}
      </td>

      {/* Lead Source */}
      <td className="px-4 py-3 hidden xl:table-cell">
        {(() => {
          const ls = formatLeadSource(user);
          if (!ls) return <span className="text-gray-600 text-xs">Direct</span>;
          return (
            <div className="min-w-0 max-w-[200px]">
              <p className="text-gray-200 text-xs font-medium truncate" title={ls.primary}>{ls.primary}</p>
              {ls.secondary && (
                <p className="text-gray-500 text-[11px] truncate" title={ls.secondary}>{ls.secondary}</p>
              )}
            </div>
          );
        })()}
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onPromoClick}
            title="Manage promotion video visibility for this user"
            className="
              px-2.5 py-1.5 rounded-lg text-xs font-semibold
              border border-amber-700/40 text-amber-400
              hover:bg-amber-900/20 hover:border-amber-600/60
              transition-all duration-150 flex items-center gap-1
            "
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Promos
          </button>
          <button
            onClick={onEnterClick}
            disabled={!user.is_active}
            className="
              px-3 py-1.5 rounded-lg text-xs font-semibold
              border border-gray-600 text-gray-300
              hover:border-red-500 hover:text-red-400 hover:bg-red-900/20
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            Enter Account
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();
  const { startImpersonation } = useAuth();
  const { showToast }       = useToast();

  const [users,       setUsers]       = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState('');
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page,        setPage]        = useState(1);

  // Impersonation modal state
  const [modalUser,       setModalUser]       = useState(null);   // target user row
  const [modalLoading,    setModalLoading]    = useState(false);
  const [modalError,      setModalError]      = useState('');

  // Promotion visibility modal state
  const [promoModalUser,  setPromoModalUser]  = useState(null);

  // Bulk-deactivate selection state
  const [selectedIds,          setSelectedIds]          = useState(() => new Set());
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [working,              setWorking]              = useState(false);

  // Shared refresh signal — bumping it reloads the active list AND the
  // Deactivated section (so a user moves between them immediately).
  const [refreshTick, setRefreshTick] = useState(0);
  const bumpRefresh = () => setRefreshTick(t => t + 1);

  // Admin accounts can't be deleted — only these rows are selectable.
  const selectableUsers = users.filter(u => u.role !== 'admin');
  const allSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedIds.has(u.id));

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableUsers.map(u => u.id)));
  }

  async function handleConfirmDeactivate() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setWorking(true);
    try {
      const { data } = await api.post('/admin/users/deactivate', { user_ids: ids });
      const skippedNote = data.skipped?.length ? ` · ${data.skipped.length} skipped` : '';
      showToast(`Deactivated ${data.deactivated} user${data.deactivated !== 1 ? 's' : ''}${skippedNote}`);
      setSelectedIds(new Set());
      setConfirmingDeactivate(false);
      bumpRefresh();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Deactivation failed', 'error');
    } finally {
      setWorking(false);
    }
  }

  // "Session expired" notice from api.js redirect param
  const [expiredNotice, setExpiredNotice] = useState(
    searchParams.get('impersonation_expired') === '1'
  );

  // ── Load users ──────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams({ page, limit: 25, status: 'active' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setPagination(data.pagination);
      setSelectedIds(new Set());
    } catch (err) {
      setFetchError(err.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, refreshTick]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Search with debounce
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // ── Inline plan update callback (called by UserRow on save) ───────────────

  function handlePlanUpdate(userId, { plan, plan_display_name, plan_expires_at }) {
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, plan, plan_display_name: plan_display_name ?? u.plan_display_name, plan_expires_at }
        : u
    ));
  }

  // ── Impersonation ───────────────────────────────────────────────────────

  async function handleConfirmImpersonate(reason) {
    if (!modalUser) return;
    setModalLoading(true);
    setModalError('');
    try {
      const { data } = await api.post(`/admin/impersonate/${modalUser.id}`, { reason });
      // Store token + set context state
      await startImpersonation(data.impersonation_token, data.target_user);
      // Navigate into the subscriber's dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setModalError(err.response?.data?.message ?? 'Failed to start impersonation session');
      setModalLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

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
            <span className="text-gray-300">User Accounts</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Impersonation expired notice */}
        {expiredNotice && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-amber-300 font-medium text-sm">Impersonation session expired</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Your 2-hour session timed out. You've been returned to your admin account.</p>
            </div>
            <button
              onClick={() => setExpiredNotice(false)}
              className="text-amber-500 hover:text-amber-300 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">User Accounts</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter any account for customer support. All access is logged and visible to the account owner.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {pagination && (
            <span className="text-gray-400 text-sm">
              {pagination.total.toLocaleString()} user{pagination.total !== 1 ? 's' : ''}
            </span>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setConfirmingDeactivate(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                         bg-amber-600/90 hover:bg-amber-500 text-white transition-colors"
            >
              <PauseIcon />
              Deactivate ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm mb-6">
            {fetchError}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-px">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !allSelected; }}
                      onChange={toggleSelectAll}
                      disabled={selectableUsers.length === 0}
                      title="Select all"
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-amber-500 cursor-pointer disabled:opacity-30"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Plan Expires</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Videos</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">DAYS</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">
                    Lead Source
                    <span className="block text-[10px] font-normal normal-case tracking-normal text-gray-600">Campaign / Ad Set / Ad</span>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-gray-700 rounded" />
                            <div className="h-2.5 w-36 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 w-20 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-3 w-6 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-3 w-6 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 w-16 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3 hidden xl:table-cell"><div className="h-3 w-24 bg-gray-700 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-7 w-24 bg-gray-700 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      {search ? 'No users match your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      selected={selectedIds.has(user.id)}
                      selectable={user.role !== 'admin'}
                      onToggleSelect={toggleSelect}
                      onPlanUpdate={handlePlanUpdate}
                      onPromoClick={() => setPromoModalUser(user)}
                      onEnterClick={() => { setModalUser(user); setModalError(''); }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!pagination.has_prev || loading}
                  className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.has_next || loading}
                  className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Deactivated users section */}
        <DeactivatedSection refreshTick={refreshTick} onChanged={bumpRefresh} showToast={showToast} />

        {/* Purged accounts log */}
        <PurgedSection refreshTick={refreshTick} />

        {/* Modal error (displayed inside the table area if modal is closed but there was an error) */}
        {modalError && !modalUser && (
          <p className="mt-3 text-red-400 text-sm">{modalError}</p>
        )}
      </main>

      {/* Impersonation confirmation modal */}
      {modalUser && (
        <ImpersonateModal
          targetUser={modalUser}
          onConfirm={handleConfirmImpersonate}
          onCancel={() => { setModalUser(null); setModalError(''); setModalLoading(false); }}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {/* Promotion visibility modal */}
      {promoModalUser && (
        <PromoModal
          targetUser={promoModalUser}
          onClose={() => setPromoModalUser(null)}
        />
      )}

      {/* Bulk-deactivate confirmation (reversible) */}
      {confirmingDeactivate && (
        <DeactivateUsersModal
          users={users.filter(u => selectedIds.has(u.id))}
          loading={working}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => setConfirmingDeactivate(false)}
        />
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserListModal — shared shell listing the affected accounts
// ─────────────────────────────────────────────────────────────────────────────

function UserListModal({ users, loading, onCancel, accent, icon, title, children, confirmEl }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !loading) onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, loading]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${accent.iconWrap}`}>
              {icon}
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          {children}
          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-700/60">
            {users.map(u => (
              <div key={u.id} className="px-3 py-2 text-sm">
                <p className="text-gray-200 truncate">{u.name || <span className="italic text-gray-500">No name</span>}</p>
                <p className="text-gray-500 text-xs truncate">{u.email}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6 flex items-center gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50">
            Cancel
          </button>
          {confirmEl}
        </div>
      </div>
    </div>
  );
}

// ── DeactivateUsersModal — reversible ────────────────────────────────────────
function DeactivateUsersModal({ users, loading, onConfirm, onCancel }) {
  const count = users.length;
  return (
    <UserListModal
      users={users} loading={loading} onCancel={onCancel}
      accent={{ iconWrap: 'bg-amber-600/20 text-amber-400' }}
      icon={<PauseIcon />}
      title={`Deactivate ${count} ${count === 1 ? 'account' : 'accounts'}?`}
      confirmEl={
        <button type="button" onClick={onConfirm} disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deactivating…</>
            : `Deactivate ${count === 1 ? 'account' : count + ' accounts'}`}
        </button>
      }
    >
      <p className="text-gray-400 text-sm">
        {count === 1 ? 'This account moves' : 'These accounts move'} to the{' '}
        <span className="text-gray-200 font-medium">Deactivated</span> section. All data is kept and
        they can be <span className="text-emerald-300 font-medium">restored anytime</span>. They won't
        be able to log in until restored.
      </p>
    </UserListModal>
  );
}

// ── PurgeUsersModal — irreversible, type-to-confirm ──────────────────────────
function PurgeUsersModal({ users, loading, onConfirm, onCancel }) {
  const count = users.length;
  const [typed, setTyped] = useState('');
  const armed = typed.trim().toUpperCase() === 'PURGE';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 text-red-400">
              <TrashIcon />
            </div>
            <h2 className="text-lg font-bold text-white">Purge {count} {count === 1 ? 'account' : 'accounts'}?</h2>
          </div>
          <p className="text-gray-400 text-sm">
            This permanently deletes {count === 1 ? 'this account' : 'these accounts'} and{' '}
            <span className="text-red-300 font-medium">all their data</span> — videos, analytics, settings.
            Logs (webhooks, CTA clicks, payments, subscription history) are kept. This{' '}
            <span className="text-red-300 font-medium">cannot be undone</span>.
          </p>
          <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-700/60">
            {users.map(u => (
              <div key={u.id} className="px-3 py-2 text-sm">
                <p className="text-gray-200 truncate">{u.name || <span className="italic text-gray-500">No name</span>}</p>
                <p className="text-gray-500 text-xs truncate">{u.email}</p>
              </div>
            ))}
          </div>
          <label className="block mt-4 text-xs text-gray-400">
            Type <span className="font-mono font-bold text-red-300">PURGE</span> to confirm
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              disabled={loading}
              autoFocus
              className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </label>
        </div>
        <div className="px-6 pb-6 flex items-center gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading || !armed}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Purging…</>
              : `Purge ${count === 1 ? 'account' : count + ' accounts'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Trash icon used by the toolbar delete button and the confirm modal
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeactivatedSection — deactivated users with Restore / Purge
// ─────────────────────────────────────────────────────────────────────────────

function deactivatedReasonLabel(reason) {
  if (reason === 'inactivity_180d') return 'Inactive 180+ days';
  if (reason === 'manual')          return 'Deactivated by admin';
  return 'Deactivated';
}

function DeactivatedSection({ refreshTick, onChanged, showToast }) {
  const [users,       setUsers]       = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [working,     setWorking]     = useState(false);
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25, status: 'deactivated' });
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setPagination(data.pagination);
      setSelectedIds(new Set());
    } catch {
      /* soft-fail — section shows empty */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load, refreshTick]);

  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));
  function toggleSelect(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() { setSelectedIds(allSelected ? new Set() : new Set(users.map(u => u.id))); }

  async function doRestore() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setWorking(true);
    try {
      const { data } = await api.post('/admin/users/restore', { user_ids: ids });
      showToast(`Restored ${data.restored} user${data.restored !== 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      onChanged();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Restore failed', 'error');
    } finally { setWorking(false); }
  }

  async function doPurge() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setWorking(true);
    try {
      const { data } = await api.post('/admin/users/purge', { user_ids: ids });
      const skippedNote = data.skipped?.length ? ` · ${data.skipped.length} skipped` : '';
      showToast(`Purged ${data.purged} user${data.purged !== 1 ? 's' : ''}${skippedNote}`);
      setSelectedIds(new Set());
      setConfirmingPurge(false);
      onChanged();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Purge failed', 'error');
    } finally { setWorking(false); }
  }

  const total = pagination?.total ?? 0;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-bold text-gray-200">Deactivated</h2>
        {total > 0 && <span className="text-gray-500 text-sm">{total}</span>}
        {selectedIds.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <button onClick={doRestore} disabled={working}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
              <RestoreIcon /> Restore ({selectedIds.size})
            </button>
            <button onClick={() => setConfirmingPurge(true)} disabled={working}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600/90 hover:bg-red-500 text-white transition-colors disabled:opacity-50">
              <TrashIcon /> Purge ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">No deactivated accounts.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-px">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-amber-500 cursor-pointer" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Deactivated</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {users.map(u => {
                  const sel = selectedIds.has(u.id);
                  return (
                    <tr key={u.id} className={sel ? 'bg-amber-500/5' : 'hover:bg-gray-700/30'}>
                      <td className="px-4 py-3 w-px">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-amber-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-200 truncate">{u.name || <span className="italic text-gray-500">No name</span>}</p>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                      </td>
                      <td className="px-4 py-3"><PlanChip plan={u.plan} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-300 text-xs">{deactivatedReasonLabel(u.deactivated_reason)}</p>
                        <p className="text-gray-500 text-xs">{formatDate(u.deactivated_at)}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">{formatRelative(u.last_login_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
            <span className="text-gray-400">Page {pagination.page} of {pagination.total_pages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.has_prev || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 disabled:opacity-40 transition-colors">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.has_next || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 disabled:opacity-40 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {confirmingPurge && (
        <PurgeUsersModal
          users={users.filter(u => selectedIds.has(u.id))}
          loading={working}
          onConfirm={doPurge}
          onCancel={() => setConfirmingPurge(false)}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PurgedSection — read-only log of purged accounts (data is gone; this is the record)
// ─────────────────────────────────────────────────────────────────────────────

function purgeReasonLabel(reason) {
  if (reason === 'inactivity_180d')  return 'Inactive 180 days';
  if (reason === 'deactivated_180d') return 'Deactivated 180 days';
  if (reason === 'manual')           return 'Manual';
  return reason || '—';
}

function PurgedSection({ refreshTick }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/admin/purged-accounts')
      .then(r => { if (!cancelled) setRows(r.data.purged ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  return (
    <section className="mt-8">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 mb-3 text-gray-300 hover:text-white">
        <h2 className="text-lg font-bold">Purged accounts</h2>
        <span className="text-gray-500 text-sm">{rows.length}</span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">No purged accounts.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium">Account</th>
                    <th className="px-4 py-3 text-left font-medium">Reason</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Created</th>
                    <th className="px-4 py-3 text-left font-medium">Purged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="text-gray-200 truncate">{r.name || <span className="italic text-gray-500">No name</span>}</p>
                        <p className="text-gray-500 text-xs truncate">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{purgeReasonLabel(r.reason)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-xs">{formatDate(r.original_created_at)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.purged_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
