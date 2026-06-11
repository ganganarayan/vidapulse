'use strict';

/**
 * Canonical webhook envelope assembler — the SINGLE source of truth for the
 * outbound payload shape (Phase 3). Both real delivery (contactWebhookSender)
 * and the admin payload preview build through here, so the preview can never
 * drift from what is actually sent.
 *
 * Format = VidaPulse's proven HYBRID, kept byte-compatible with the live CRM
 * (Divine Leads / MyAppZ) field mapping:
 *   - Standard contact fields FLAT: contact_name / contact_email / contact_phone
 *   - Custom fields dotted: "contact.<key>" (CRM only maps prefixed custom fields)
 *   - Plus top-level meta: event / source / timestamp
 *
 * It is a strict SUPERSET of every payload sent before this phase:
 *   • CRM events previously sent contact_name/email/phone + contact.contact_plan
 *     + contact.event_type  → all preserved (extra meta fields are ignored by CRM).
 *   • Stage events previously sent contact_email + contact.event_type
 *     + contact.timestamp    → all preserved.
 *
 * Pure function (no DB / no env) so it is trivially testable and previewable.
 */

/**
 * @param {string} eventKey  - registry event key (also the public event name)
 * @param {object} opts
 * @param {{name?:string,email?:string,phone?:string,plan?:string}} [opts.user]
 * @param {string} [opts.timestamp] - ISO timestamp (defaults to now via caller)
 * @param {Object<string,string|number>} [opts.extraFields] - extra dotted custom
 *        fields, passed WITHOUT the prefix, e.g. { pass_reset_link: '…' } →
 *        "contact.pass_reset_link". Empty/null values are dropped.
 * @returns {object} the flat hybrid envelope ready to POST as JSON.
 */
function buildEnvelope(eventKey, opts = {}) {
  const { user = {}, timestamp, extraFields = {} } = opts;
  const ts = timestamp || new Date().toISOString();

  // admin_lifetime is internal — report it to the CRM as "pro" (matches the
  // previous _buildLogParams behaviour exactly).
  const rawPlan = user.plan || 'free';
  const planName = rawPlan === 'admin_lifetime' ? 'pro' : rawPlan;

  const envelope = {
    event: eventKey,
    source: 'vidapulse',
    timestamp: ts,
  };

  // Standard contact fields — flat, only when present (mirrors _buildBody).
  if (user.name)  envelope.contact_name  = user.name;
  if (user.email) envelope.contact_email = user.email;
  if (user.phone) envelope.contact_phone = user.phone;

  // Custom fields — dotted so the CRM maps them.
  envelope['contact.contact_plan'] = planName;
  envelope['contact.event_type']   = eventKey;
  envelope['contact.timestamp']    = ts;

  for (const [k, v] of Object.entries(extraFields)) {
    if (v !== undefined && v !== null && v !== '') envelope[`contact.${k}`] = v;
  }

  return envelope;
}

/**
 * Representative sample envelope for the admin "preview payload" panel.
 * Read-only — never sent.
 */
function buildSampleEnvelope(eventKey) {
  return buildEnvelope(eventKey, {
    timestamp: '2026-01-01T12:00:00.000Z',
    user: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+919876543210', plan: 'free' },
  });
}

module.exports = { buildEnvelope, buildSampleEnvelope };
