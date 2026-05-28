'use strict';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

/**
 * AdminPromotionPage — /admin/promotion
 *
 * Admin manages promotion videos:
 *   • Add video by URL (same as Dashboard)
 *   • 4 radio buttons per video: Noshow | Free | Starter | Pro
 *   • Reorder with ↑↓ arrows
 *   • Delete button per video
 *   • Embed code copy
 *
 * Videos default to 'noshow' on creation so the admin can preview
 * before making them visible to subscribers.
 */

const VISIBILITY_OPTIONS = [
  {
    value: 'noshow',
    label: 'Noshow',
    desc : 'Admin only',
    color: 'text-gray-400',
    ring : 'ring-gray-600',
    dot  : 'bg-gray-500',
  },
  {
    value: 'free',
    label: 'Free',
    desc : 'Everyone',
    color: 'text-emerald-400',
    ring : 'ring-emerald-500/60',
    dot  : 'bg-emerald-400',
  },
  {
    value: 'starter',
    label: 'Starter',
    desc : 'Starter + Pro',
    color: 'text-amber-400',
    ring : 'ring-amber-500/60',
    dot  : 'bg-amber-400',
  },
  {
    value: 'pro',
    label: 'Pro',
    desc : 'Pro only',
    color: 'text-indigo-400',
    ring : 'ring-indigo-500/60',
    dot  : 'bg-indigo-400',
  },
];

const SOURCE_LABELS = {
  youtube:'YouTube', vimeo:'Vimeo', loom:'Loom', zoom:'Zoom',
  google_drive:'Google Drive', dropbox:'Dropbox', mp4_direct:'Direct MP4',
  hls_stream:'HLS Stream', amazon_s3:'Amazon S3', azure_blob:'Azure Blob', other:'Video',
};

function fmtDuration(secs) {
  if (!secs || secs <= 0) return null;
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function AdminPromotionPage() {
  const navigate       = useNavigate();
  const { showToast }  = useToast();

  const [promos,    setPromos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [addUrl,    setAddUrl]    = useState('');
  const [addTitle,  setAddTitle]  = useState('');
  const [addError,  setAddError]  = useState('');
  const [submitting,setSubmitting]= useState(false);
  const urlInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/promotion-videos');
      setPromos(data.videos ?? []);
    } catch { showToast('Failed to load promotion videos', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (adding) setTimeout(() => urlInputRef.current?.focus(), 50); }, [adding]);

  // ── Add video ───────────────────────────────────────────────────────────

  async function handleAdd(e) {
    e.preventDefault();
    setAddError('');
    const trimUrl = addUrl.trim();
    if (!trimUrl) return;
    try { new URL(trimUrl); } catch {
      setAddError("That doesn't look like a valid URL.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/promotion-videos', {
        url  : trimUrl,
        title: addTitle.trim() || undefined,
      });
      setPromos(prev => [...prev, data.promo]);
      setAdding(false);
      setAddUrl('');
      setAddTitle('');
      showToast('Promotion video added (visibility: Noshow)');
    } catch (err) {
      setAddError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Visibility change ───────────────────────────────────────────────────

  async function handleVisibility(promoId, newVisibility) {
    // Optimistic update
    setPromos(prev => prev.map(p => p.id === promoId ? { ...p, visibility: newVisibility } : p));
    try {
      await api.patch(`/admin/promotion-videos/${promoId}/visibility`, { visibility: newVisibility });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to update visibility', 'error');
      load(); // revert
    }
  }

  // ── Reorder ─────────────────────────────────────────────────────────────

  async function movePromo(index, direction) {
    const newList = [...promos];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    setPromos(newList);
    try {
      await api.patch('/admin/promotion-videos/reorder', {
        ordered_ids: newList.map(p => p.id),
      });
    } catch {
      showToast('Failed to save order', 'error');
      load();
    }
  }

  // ── Rename ──────────────────────────────────────────────────────────────

  async function handleRename(promoId, newTitle) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    // Optimistic update
    setPromos(prev => prev.map(p => p.id === promoId ? { ...p, title: trimmed } : p));
    try {
      await api.patch(`/admin/promotion-videos/${promoId}/title`, { title: trimmed });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to rename', 'error');
      load(); // revert
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(promoId) {
    if (!window.confirm('Delete this promotion video? This cannot be undone.')) return;
    setPromos(prev => prev.filter(p => p.id !== promoId));
    try {
      await api.delete(`/admin/promotion-videos/${promoId}`);
      showToast('Promotion video deleted');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Delete failed', 'error');
      load();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
              <BackIcon />
            </button>
            <span className="text-amber-500 text-xl font-bold select-none">{'▶︎'}</span>
            <span className="text-white font-semibold">VidaPulse</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-gray-300">Promotion Videos</span>
          </div>
          <button
            onClick={() => { setAdding(true); setAddError(''); }}
            disabled={adding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400
                       disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <PlusIcon /> Add video
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Explainer */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-400 mb-1">How promotion videos work</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Videos added here are <strong className="text-gray-300">pinned at the top</strong> of
            every subscriber's video list and overview dashboard, separated by a divider.
            Use the visibility radio buttons to control which plan tier can see each video.
            Start with <strong className="text-gray-300">Noshow</strong> to test before publishing.
            Promotion videos are <strong className="text-gray-300">quota-exempt</strong> — they
            don't count against any subscriber's video limit.
          </p>
        </div>

        {/* Add video form */}
        {adding && (
          <form
            onSubmit={handleAdd}
            className="bg-gray-800/60 border border-amber-500/30 rounded-xl p-5 flex flex-col gap-3"
          >
            <p className="text-sm font-semibold text-gray-200">Add promotion video</p>
            <input
              ref={urlInputRef}
              type="text"
              value={addUrl}
              onChange={e => { setAddUrl(e.target.value); setAddError(''); }}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                         text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500"
              disabled={submitting}
              autoComplete="off"
            />
            <input
              type="text"
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              placeholder="Custom title (optional — defaults to URL hostname)"
              className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5
                         text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500"
              disabled={submitting}
            />
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !addUrl.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Adding…' : 'Add video'}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setAddUrl(''); setAddTitle(''); setAddError(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Video list */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12">
            <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-600">{'▶︎'}</span>
            </div>
            <p className="text-gray-400 text-sm">No promotion videos yet.</p>
            <p className="text-gray-600 text-xs mt-1">Click "Add video" to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {promos.map((promo, index) => (
              <PromotionVideoRow
                key={promo.id}
                promo={promo}
                index={index}
                total={promos.length}
                onVisibilityChange={handleVisibility}
                onMove={movePromo}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PromotionVideoRow — video bar + radio buttons + controls
// ─────────────────────────────────────────────────────────────────────────

function PromotionVideoRow({ promo, index, total, onVisibilityChange, onMove, onRename, onDelete }) {
  const [embedCopied, setEmbedCopied] = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editValue,   setEditValue]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const editInputRef  = useRef(null);

  const duration    = fmtDuration(promo.duration_seconds);
  const sourceLabel = SOURCE_LABELS[promo.source_type] ?? 'Video';

  function startEdit() {
    setEditValue(promo.title);
    setEditing(true);
    setTimeout(() => editInputRef.current?.select(), 30);
  }

  function cancelEdit() {
    setEditing(false);
    setEditValue('');
  }

  async function commitEdit() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === promo.title) { cancelEdit(); return; }
    setSaving(true);
    await onRename(promo.id, trimmed);
    setSaving(false);
    setEditing(false);
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { cancelEdit(); }
  }

  function handleEmbedCopy(e) {
    e.stopPropagation();
    const origin  = window.location.origin;
    const snippet = `<iframe\n  src="${origin}/embed/${promo.video_id}"\n  width="560"\n  height="315"\n  frameborder="0"\n  allow="autoplay; fullscreen; picture-in-picture"\n  allowfullscreen>\n</iframe>`;
    navigator.clipboard.writeText(snippet)
      .then(() => { setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2500); })
      .catch(() => {});
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Video bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Sort controls */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
            title="Move up"
          >
            <ChevronUpIcon />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
            title="Move down"
          >
            <ChevronDownIcon />
          </button>
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 relative w-24 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
          {promo.thumbnail_url
            ? <img src={promo.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <VideoPlaceholderIcon />
          }
          {duration && (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-none">
              {duration}
            </span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                disabled={saving}
                className="flex-1 min-w-0 bg-gray-700 border border-amber-500 text-gray-100 rounded-md
                           px-2 py-1 text-sm focus:outline-none"
              />
              <button
                onMouseDown={e => { e.preventDefault(); commitEdit(); }}
                disabled={saving}
                className="flex-shrink-0 p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Save"
              >
                <CheckIcon />
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
                className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                title="Cancel"
              >
                <XIcon />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group/title min-w-0">
              <p className="font-semibold text-gray-100 truncate">{promo.title}</p>
              <button
                onClick={startEdit}
                className="flex-shrink-0 p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700
                           opacity-0 group-hover/title:opacity-100 transition-all"
                title="Rename"
              >
                <PencilIcon />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span>{sourceLabel}</span>
            <span className="text-gray-600">·</span>
            <span>{(promo.total_views ?? 0).toLocaleString()} views</span>
            {promo.hidden_count > 0 && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-amber-500/70">{promo.hidden_count} hidden</span>
              </>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleEmbedCopy}
            title="Copy embed code"
            className={`p-1.5 rounded-lg transition-colors ${
              embedCopied
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {embedCopied ? <CheckIcon /> : <EmbedIcon />}
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            title="Delete promotion video"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Visibility radio buttons */}
      <div className="border-t border-gray-700/40 px-4 py-3 flex items-center gap-1 sm:gap-3 flex-wrap">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mr-1 flex-shrink-0">
          Visibility
        </span>
        {VISIBILITY_OPTIONS.map(opt => {
          const active = promo.visibility === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer
                border transition-all select-none text-xs font-medium
                ${active
                  ? `${opt.color} border-current bg-current/5 ring-1 ${opt.ring}`
                  : 'text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300'
                }`}
            >
              <input
                type="radio"
                name={`visibility-${promo.id}`}
                value={opt.value}
                checked={active}
                onChange={() => onVisibilityChange(promo.id, opt.value)}
                className="sr-only"
              />
              {active && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} flex-shrink-0`} />}
              <span>{opt.label}</span>
              <span className={`text-[10px] ${active ? 'opacity-70' : 'opacity-40'}`}>
                ({opt.desc})
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function VideoPlaceholderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}
function EmbedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
