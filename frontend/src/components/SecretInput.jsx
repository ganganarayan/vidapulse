import React, { useState } from 'react';

/**
 * SecretInput: a masked input for secrets, keys and tokens.
 *
 *   eye      toggles the value between hidden and visible
 *   copy     copies the value to the clipboard WITHOUT revealing it
 *   generate (optional, `generate` prop) creates a random 32-byte hex secret
 *            and fills the field with it (stays masked; copy it from here)
 *
 * Props mirror a plain <input>: value, onChange(event), placeholder, name,
 * autoComplete, className (applied to the input). onChange receives a
 * synthetic { target: { value } } when the generator fills the field.
 */

export function randomSecret(bytes = 32) {
  const a = new Uint8Array(bytes);
  window.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without the async clipboard (or non-secure context).
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

export default function SecretInput({
  value, onChange, placeholder, name, autoComplete = 'new-password',
  className = '', style, generate = false, disabled = false,
}) {
  const [show,   setShow]   = useState(false);
  const [copied, setCopied] = useState('');

  async function onCopy() {
    if (!value) return;
    const ok = await copyText(value);
    setCopied(ok ? 'Copied' : 'Copy failed');
    setTimeout(() => setCopied(''), 1500);
  }

  function onGenerate() {
    if (value && !window.confirm('Replace the current secret with a new random one? Remember to update it on the receiving side too.')) return;
    onChange({ target: { value: randomSecret() } });
    setCopied('Generated: copy it, then save');
    setTimeout(() => setCopied(''), 2500);
  }

  const iconBtn = 'p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-700/60 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div>
      <div className="flex items-center gap-1">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          spellCheck="false"
          disabled={disabled}
          className={`flex-1 min-w-0 ${className}`}
          style={style}
        />
        <button type="button" className={iconBtn} onClick={() => setShow((s) => !s)}
          title={show ? 'Hide' : 'Show'} aria-label={show ? 'Hide secret' : 'Show secret'}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <button type="button" className={iconBtn} onClick={onCopy} disabled={!value}
          title="Copy" aria-label="Copy secret">
          <CopyIcon />
        </button>
        {generate && (
          <button type="button" className={iconBtn} onClick={onGenerate} disabled={disabled}
            title="Generate a random secret" aria-label="Generate a random secret">
            <DiceIcon />
          </button>
        )}
      </div>
      {copied && <p className="text-[11px] text-emerald-400 mt-1">{copied}</p>}
    </div>
  );
}

const svg = (children) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
function EyeIcon()    { return svg(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>); }
function EyeOffIcon() { return svg(<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>); }
function CopyIcon()   { return svg(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>); }
function DiceIcon()   { return svg(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1" fill="currentColor" /><circle cx="15.5" cy="8.5" r="1" fill="currentColor" /><circle cx="8.5" cy="15.5" r="1" fill="currentColor" /></>); }
