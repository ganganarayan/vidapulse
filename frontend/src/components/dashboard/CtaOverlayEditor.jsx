// ─────────────────────────────────────────────────────────────────────────
// CtaOverlayEditor — timed CTA overlay buttons for the embedded player.
//
// Shown at the bottom of Player Settings. A master toggle reveals the editor.
// The founder defines up to 3 buttons; each appears over the video at its
// start second and stays (it only dims after a few seconds so it never hides
// the subtitles/action). Placement + size are set by DRAGGING and RESIZING the
// button directly on a preview frame — no coordinate typing.
//
// Each overlay points at a destination URL (typically one of the account's CTA
// tracking links). On click the player fires a placement-tagged cta_click event
// so a booking attributes to CTA-1 / CTA-2 / CTA-3.
//
// Config shape persisted to video_player_settings.cta_overlays:
//   { id, label, url, start_second, dim_after_seconds, x, y, w }
// x/y are the button CENTRE as a % of the player box; w is its width %.
// ─────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const MAX_OVERLAYS = 3;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function fmtClock(secs) {
  const s = Math.max(0, Math.floor(Number(secs) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// A CTA tracking link's public redirect URL (logs the click, then 302s).
function trackingLinkUrl(origin, id) {
  return `${origin}/api/analytics/cta/link/${id}`;
}

function newOverlay(n) {
  return {
    id               : `cta-${n}`,
    label            : n === 1 ? 'Book a call' : `CTA ${n}`,
    url              : '',
    start_second     : 0,
    dim_after_seconds: 10,
    x                : 50,
    y                : 82,
    w                : 38,
  };
}

export default function CtaOverlayEditor({ video, settings, onSave, saving }) {
  const { showToast } = useToast();
  const origin  = typeof window !== 'undefined' ? window.location.origin : '';

  const [enabled,  setEnabled]  = useState(!!settings?.cta_enabled);
  const [overlays, setOverlays] = useState(() =>
    Array.isArray(settings?.cta_overlays) ? settings.cta_overlays.map(normalize) : []);
  const [selected, setSelected] = useState(0);
  const [ctaLinks, setCtaLinks] = useState(null); // null = loading
  const [dirty,    setDirty]    = useState(false);

  const frameRef = useRef(null);

  // Seed local state whenever the persisted settings change (e.g. first load).
  useEffect(() => {
    setEnabled(!!settings?.cta_enabled);
    setOverlays(Array.isArray(settings?.cta_overlays) ? settings.cta_overlays.map(normalize) : []);
    setDirty(false);
  }, [settings]);

  // The account's CTA tracking links populate the destination picker.
  useEffect(() => {
    api.get('/cta-links')
      .then(r => setCtaLinks(r.data?.cta_links ?? []))
      .catch(() => setCtaLinks([]));
  }, []);

  function normalize(o) {
    return {
      id               : String(o?.id ?? '').slice(0, 40),
      label            : String(o?.label ?? '').slice(0, 80),
      url              : String(o?.url ?? ''),
      start_second     : clamp(Number(o?.start_second) || 0, 0, 86400),
      dim_after_seconds: clamp(Number(o?.dim_after_seconds ?? 10), 0, 600),
      x                : clamp(Number(o?.x ?? 50), 0, 100),
      y                : clamp(Number(o?.y ?? 82), 0, 100),
      w                : clamp(Number(o?.w ?? 38), 5, 95),
    };
  }

  // ── Persist ───────────────────────────────────────────────────────────
  // The backend requires each overlay to have a label and an http(s) URL. Catch
  // incomplete rows here so a half-filled CTA gives a clear message instead of a
  // generic 400. Enabling with zero overlays is fine (nothing to validate).
  function persist(nextEnabled, nextOverlays) {
    for (let i = 0; i < nextOverlays.length; i++) {
      const o = nextOverlays[i];
      if (!o.label.trim() || !/^https?:\/\//i.test(o.url.trim())) {
        showToast(`CTA ${i + 1} needs a button label and a destination URL`, 'error');
        return;
      }
    }
    onSave({ cta_enabled: nextEnabled, cta_overlays: nextOverlays });
    setDirty(false);
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      // Disabling must always succeed — leave the stored overlays untouched
      // (don't re-validate half-filled rows the user is still editing).
      onSave({ cta_enabled: false });
      setDirty(false);
      return;
    }
    persist(true, overlays);          // enabling validates + saves
  }

  function updateOverlay(idx, patch) {
    setOverlays(prev => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
    setDirty(true);
  }

  function addOverlay() {
    if (overlays.length >= MAX_OVERLAYS) return;
    // Give each new CTA a unique id even if an earlier one was removed.
    const used = new Set(overlays.map(o => o.id));
    let n = 1; while (used.has(`cta-${n}`)) n++;
    const next = [...overlays, newOverlay(n)];
    setOverlays(next);
    setSelected(next.length - 1);
    setDirty(true);
  }

  function removeOverlay(idx) {
    const next = overlays.filter((_, i) => i !== idx);
    setOverlays(next);
    setSelected(s => Math.max(0, Math.min(s, next.length - 1)));
    setDirty(true);
  }

  // ── Drag / resize on the preview frame ─────────────────────────────────
  // pointer events → % of the frame box. Drag moves the centre; the resize
  // handle at the right edge changes width while keeping the centre fixed.
  const dragRef = useRef(null); // { idx, mode: 'move'|'resize' }

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    const frame = frameRef.current;
    if (!d || !frame) return;
    const r = frame.getBoundingClientRect();
    const px = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
    const py = clamp(((e.clientY - r.top) / r.height) * 100, 0, 100);
    setOverlays(prev => prev.map((o, i) => {
      if (i !== d.idx) return o;
      if (d.mode === 'move') return { ...o, x: Math.round(px), y: Math.round(py) };
      // resize: right edge follows the pointer, centre stays put
      const w = clamp(Math.round((px - o.x) * 2), 5, 95);
      return { ...o, w };
    }));
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    setDirty(true);
  }, [onPointerMove]);

  function startDrag(e, idx, mode) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(idx);
    dragRef.current = { idx, mode };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  }

  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [onPointerMove, endDrag]);

  const accent = /^#[0-9a-fA-F]{6}$/.test(settings?.accent_color || '') ? settings.accent_color : '#F59E0B';

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="px-5 py-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">Call-to-Action buttons</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Show timed buttons over the video — appear at a set time, stay on screen, and track every click.
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          className={`relative inline-flex flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-200 ml-4
            ${enabled ? 'bg-amber-500' : 'bg-gray-600'}`}
          role="switch"
          aria-checked={enabled}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
            ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-5 flex flex-col gap-5">
          {/* Preview frame with draggable / resizable buttons */}
          <div>
            <p className="text-[11px] text-gray-500 mb-2">
              Drag each button to position it. Drag the ● handle on its right edge to resize.
            </p>
            <div
              ref={frameRef}
              className="relative w-full rounded-xl overflow-hidden border border-gray-700 bg-gray-950 select-none"
              style={{
                aspectRatio: '16 / 9',
                backgroundImage: video?.thumbnail_url ? `url(${video.thumbnail_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!video?.thumbnail_url && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
                  Video preview
                </div>
              )}
              {overlays.map((o, i) => (
                <div
                  key={o.id}
                  onPointerDown={(e) => startDrag(e, i, 'move')}
                  className="absolute flex items-center justify-center text-center font-bold text-white rounded-lg shadow-lg"
                  style={{
                    left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`,
                    transform: 'translate(-50%, -50%)',
                    background: accent,
                    padding: '6px 10px',
                    fontSize: 'clamp(9px, 1.6vw, 14px)',
                    lineHeight: 1.15,
                    cursor: 'move',
                    outline: selected === i ? '2px solid #fff' : 'none',
                    outlineOffset: '1px',
                    opacity: selected === i ? 1 : 0.9,
                    zIndex: selected === i ? 3 : 2,
                    wordBreak: 'break-word',
                  }}
                >
                  <span className="pointer-events-none truncate">{o.label || 'CTA'}</span>
                  {/* resize handle */}
                  <span
                    onPointerDown={(e) => startDrag(e, i, 'resize')}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-400"
                    style={{ cursor: 'ew-resize' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA cards */}
          <div className="flex flex-col gap-3">
            {overlays.length === 0 && (
              <p className="text-xs text-gray-500">No CTAs yet. Add one to place it on the video.</p>
            )}
            {overlays.map((o, i) => (
              <div
                key={o.id}
                onClick={() => setSelected(i)}
                className={`rounded-xl border p-4 cursor-pointer transition-colors
                  ${selected === i ? 'border-amber-500/50 bg-amber-500/[0.04]' : 'border-gray-700/50 bg-gray-900/30'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    CTA {i + 1}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeOverlay(i); }}
                    className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Button label */}
                  <label className="col-span-2 block">
                    <span className="text-[11px] text-gray-400">Button text</span>
                    <input
                      type="text" maxLength={80} value={o.label}
                      onChange={(e) => updateOverlay(i, { label: e.target.value })}
                      placeholder="Book a 1:1"
                      className="mt-1 w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-amber-500/60 focus:outline-none"
                    />
                  </label>

                  {/* Appears at */}
                  <label className="block">
                    <span className="text-[11px] text-gray-400">Appears at (seconds)</span>
                    <input
                      type="number" min={0} value={o.start_second}
                      onChange={(e) => updateOverlay(i, { start_second: clamp(parseInt(e.target.value, 10) || 0, 0, 86400) })}
                      className="mt-1 w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-amber-500/60 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">= {fmtClock(o.start_second)}</span>
                  </label>

                  {/* Dim after */}
                  <label className="block">
                    <span className="text-[11px] text-gray-400">Fade after (seconds)</span>
                    <input
                      type="number" min={0} value={o.dim_after_seconds}
                      onChange={(e) => updateOverlay(i, { dim_after_seconds: clamp(parseInt(e.target.value, 10) || 0, 0, 600) })}
                      className="mt-1 w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-amber-500/60 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">0 = never fade</span>
                  </label>

                  {/* Destination */}
                  <label className="col-span-2 block">
                    <span className="text-[11px] text-gray-400">Destination (opens on click)</span>
                    <DestinationPicker
                      value={o.url}
                      ctaLinks={ctaLinks}
                      origin={origin}
                      onChange={(url) => updateOverlay(i, { url })}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={addOverlay}
              disabled={overlays.length >= MAX_OVERLAYS}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-600 text-gray-200
                         hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Add CTA {overlays.length >= MAX_OVERLAYS ? '(max 3)' : ''}
            </button>
            <button
              onClick={() => persist(enabled, overlays)}
              disabled={!dirty || saving}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-gray-900
                         hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : dirty ? 'Save CTAs' : 'Saved'}
            </button>
            {dirty && <span className="text-[11px] text-amber-400/80">Unsaved changes</span>}
          </div>

          {ctaLinks && ctaLinks.length === 0 && (
            <p className="text-[11px] text-gray-500">
              Tip: create named <a href="/cta-tracking" className="text-amber-400 hover:underline">CTA tracking links</a> to
              log richer click data (device, location). You can also paste any URL above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Destination picker: choose a tracking link or paste a custom URL ────────
function DestinationPicker({ value, ctaLinks, origin, onChange }) {
  const links = ctaLinks || [];
  const matchedLink = links.find(l => trackingLinkUrl(origin, l.id) === value);
  const [mode, setMode] = useState(matchedLink ? 'link' : (value ? 'custom' : 'link'));

  useEffect(() => {
    // Re-derive mode when the value is set from outside (e.g. loading saved data)
    const m = links.find(l => trackingLinkUrl(origin, l.id) === value);
    if (m) setMode('link');
  }, [value, links, origin]);

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`px-2 py-1 rounded ${mode === 'link' ? 'bg-amber-500/15 text-amber-300' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Tracking link
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-2 py-1 rounded ${mode === 'custom' ? 'bg-amber-500/15 text-amber-300' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Custom URL
        </button>
      </div>

      {mode === 'link' ? (
        <select
          value={matchedLink ? matchedLink.id : ''}
          onChange={(e) => { const l = links.find(x => x.id === e.target.value); onChange(l ? trackingLinkUrl(origin, l.id) : ''); }}
          className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-amber-500/60 focus:outline-none"
        >
          <option value="">{links.length ? 'Select a CTA tracking link…' : 'No tracking links yet'}</option>
          {links.map(l => (
            <option key={l.id} value={l.id}>{l.cta_name}{l.page_name ? ` — ${l.page_name}` : ''}</option>
          ))}
        </select>
      ) : (
        <input
          type="url" value={value} placeholder="https://calendly.com/you/intro"
          onChange={(e) => onChange(e.target.value.trim())}
          className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:border-amber-500/60 focus:outline-none"
        />
      )}
    </div>
  );
}
