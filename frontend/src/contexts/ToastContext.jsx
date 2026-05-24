import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * ToastContext — app-wide amber "Saved" notification badge.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Settings saved');
 *   showToast('Something failed', 'error');
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast,   setToast]   = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, key: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastBadge toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Graceful fallback — components outside the provider won't crash
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

// ── Amber badge that slides up from bottom-right ──────────────────────────

function ToastBadge({ toast, onDismiss }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      key={toast.key}
      className={`fixed bottom-6 right-6 z-[9999]
                  flex items-center gap-2.5
                  px-4 py-3 rounded-xl border shadow-2xl
                  text-sm font-semibold select-none
                  ${isError
                    ? 'bg-red-500 text-white border-red-400/50'
                    : 'bg-amber-500 text-gray-900 border-amber-400/60'
                  }`}
      style={{ animation: 'vpSlideUp 0.22s ease-out' }}
    >
      <span className="text-base leading-none">{isError ? '✕' : '✓'}</span>
      {toast.message}
      <button
        onClick={onDismiss}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Dismiss"
      >×</button>
      <style>{`
        @keyframes vpSlideUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
