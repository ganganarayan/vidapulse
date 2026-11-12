/**
 * formatIST: DD-MM-YYYY HH:MM in IST (UTC+05:30), from a fixed offset so the
 * browser's locale and timezone never decide the order.
 */
export function formatIST(value, { time = true } = {}) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const date = `${p(ist.getUTCDate())}-${p(ist.getUTCMonth() + 1)}-${ist.getUTCFullYear()}`;
  return time ? `${date} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}` : date;
}
