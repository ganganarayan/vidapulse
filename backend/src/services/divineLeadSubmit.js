'use strict';

/**
 * divineLeadSubmit — push every NEW signup into the DivineLead (myappz.ai)
 * opt-in form so its "Form filled" automation fires (WhatsApp + email).
 *
 * This is a server-to-server submission appended to the signup flow. It is the
 * trigger itself — there is NO webhook. It must:
 *   • fire EXACTLY ONCE per newly-created account (never on login/refresh),
 *   • never block or break signup (fire-and-forget, swallow all errors).
 *
 * NOTE: this is a custom myappz.ai stack — NOT GoHighLevel / LeadConnector.
 * The submission contract below was read off the live form; send it verbatim.
 */

const { pool } = require('../config/database');
const logger   = require('../config/logger');

// Hardcoded on purpose — this is the permanent VidaPulse opt-in form.
// It never changes, so it is NOT an env var or a configurable form-id.
const VIDAPULSE_FORM_URL = 'https://login.vidapulse.io/widget/form/6a147c7a7223e';

const TIMEOUT_MS    = 10_000;
const MAX_ATTEMPTS  = 3;

/**
 * Atomically claim the once-only flag for a user. Returns true ONLY for the
 * caller that flips divinelead_synced_at from NULL → now(). Concurrent/retry
 * callers get false, so the submit can never fire twice.
 * Never throws — on DB error returns false (bias: a missed push beats a
 * double-fire that spams a real person).
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function markDivineLeadSynced(userId) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET divinelead_synced_at = NOW()
        WHERE id = $1 AND divinelead_synced_at IS NULL`,
      [userId]
    );
    return rowCount === 1;
  } catch (err) {
    logger.error(`[VidaPulse→DivineLead] markDivineLeadSynced failed for ${userId}: ${err.message}`);
    return false;
  }
}

/**
 * Submit one lead to the DivineLead form. Non-blocking, retried, timed out.
 * Email is the guaranteed field; name falls back to the email local-part so
 * at least two fields are always sent. Returns a small result; callers ignore.
 *
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @returns {Promise<{ok:boolean, status?:number, reason?:string}>}
 */
async function submitToVidaPulse(name, email, phone) {
  if (!email || !email.includes('@')) {
    logger.error('[VidaPulse→DivineLead] missing/invalid email — skipping');
    return { ok: false, reason: 'no_email' };
  }

  let finalName = (name || '').trim();
  if (!finalName) finalName = email.split('@')[0]; // chars before @
  const finalEmail = email.trim();
  const finalPhone = (phone || '').trim();

  // Build a multipart/form-data body. Populate EVERY field — both the flat
  // keys (name/email/phone) AND each fields[N][value] — so the value reaches
  // the contact regardless of which the widget reads. id/label/name describe
  // the form field; value carries the data; custom_field_id stays empty.
  // Rebuilt per attempt because a FormData body stream is single-use.
  function buildBody() {
    const fd = new FormData();
    fd.set('fields[0][id]', '149840');
    fd.set('fields[0][label]', 'Name');
    fd.set('fields[0][name]', 'name');
    fd.set('fields[0][value]', finalName);
    fd.set('fields[0][custom_field_id]', '');
    fd.set('fields[1][id]', '149841');
    fd.set('fields[1][label]', 'Email');
    fd.set('fields[1][name]', 'email');
    fd.set('fields[1][value]', finalEmail);
    fd.set('fields[1][custom_field_id]', '');
    fd.set('fields[2][id]', '149842');
    fd.set('fields[2][label]', 'Phone');
    fd.set('fields[2][name]', 'phone');
    fd.set('fields[2][value]', finalPhone);
    fd.set('fields[2][custom_field_id]', '');
    fd.set('name',  finalName);
    fd.set('email', finalEmail);
    fd.set('phone', finalPhone);
    return fd;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Do NOT set Content-Type — fetch derives the multipart boundary from the
      // FormData body automatically. Setting it manually would break parsing.
      const res = await fetch(VIDAPULSE_FORM_URL, {
        method : 'POST',
        headers: {
          'Origin'    : 'https://login.vidapulse.io',
          'Referer'   : VIDAPULSE_FORM_URL,
          'User-Agent': 'VidaPulse-Server/1.0',
          'Accept'    : 'application/json, text/html, */*',
        },
        body  : buildBody(),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await res.text().catch(() => '');
      if (res.ok) {
        logger.info(`[VidaPulse→DivineLead] sent for ${finalEmail} (status ${res.status})`);
        return { ok: true, status: res.status };
      }
      logger.warn(`[VidaPulse→DivineLead] attempt ${attempt} status ${res.status}: ${text.slice(0, 200)}`);
    } catch (err) {
      clearTimeout(timer);
      const reason = controller.signal.aborted ? 'timeout' : err.message;
      logger.warn(`[VidaPulse→DivineLead] attempt ${attempt} error: ${reason}`);
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, attempt * 1000)); // linear backoff 1s, 2s
    }
  }

  logger.error(`[VidaPulse→DivineLead] all attempts failed for ${finalEmail}`);
  return { ok: false, reason: 'all_attempts_failed' };
}

module.exports = { submitToVidaPulse, markDivineLeadSynced };
