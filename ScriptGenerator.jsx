/**
 * Video Script Generator Agent
 * Neuro-Acoustic Protocol | Neural Dissonance Assessment Funnel
 * Ganga Narayan Das — Monk-Consultant
 *
 * Standalone .jsx — works in Claude.ai Artifacts or as a Vite/React page.
 * Drop the React import lines if pasting into Claude Artifacts.
 */

import React, { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0f0f",
  surface: "#141828",
  surfaceAlt: "#0d1f2d",
  surfaceHover: "#1a2035",
  gold: "#C9A84C",
  goldDim: "#C9A84C33",
  saffron: "#E07B39",
  saffronDim: "#E07B3933",
  text: "#F5F0E8",
  textMid: "#9a9a9a",
  textDim: "#6a6a7a",
  textVeryDim: "#3a3a4a",
  border: "#252535",
  borderMid: "#1e1e2e",
  error: "#ff8888",
  errorBg: "#2a0f0f",
  errorBorder: "#5a1a1a",
  success: "#4caf82",
};

const FONTS = {
  heading: "'Playfair Display', serif",
  body: "'DM Sans', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: "gita_vsl", label: "Gita VSL / 1-on-1 Booking Funnel" },
  { id: "nap", label: "Neuro-Acoustic Protocol (NAP)" },
  { id: "nda", label: "Neural Dissonance Assessment" },
  { id: "vidapulse", label: "VidaPulse" },
  { id: "ai_gita", label: "AI Gita Mentor / Clone of GND" },
  { id: "divine_leads", label: "Divine Leads Agency Account" },
];

const AUDIENCES = [
  { id: "doctors", label: "Doctors" },
  { id: "lawyers", label: "Lawyers" },
  { id: "retired", label: "Retired Professionals" },
  { id: "working", label: "Working Professionals" },
  { id: "agency", label: "Agency Owners / Coaches" },
];

const FORMATS = [
  { id: "short", label: "Short Ad", sub: "30–40 sec · 70–90 words" },
  { id: "medium", label: "Medium Ad", sub: "45–60 sec · 110–140 words" },
  { id: "vsl", label: "VSL Hook", sub: "60–90 sec · 150–200 words" },
];

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "all", label: "All Platforms" },
];

const QUANTITIES = [1, 3, 5, 10];
const HOOK_COUNTS = [10, 15, 20];

const MODES = [
  { id: "generate", label: "Generate Scripts" },
  { id: "hooks", label: "Hooks Only" },
  { id: "rewrite", label: "Rewrite Script" },
  { id: "adapt", label: "Platform Adapt" },
  { id: "validate", label: "Validate Script" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional video script writer for Ganga Narayan Das, a monk-consultant who teaches the Neuro-Acoustic Protocol — a proprietary system that works on the sympathetic/parasympathetic nervous system to resolve what high-achieving professionals feel but cannot name: emotional numbness, identity loss, relational distance, purpose drought.

You write short video ad scripts (30–90 seconds) for Facebook, Instagram, and LinkedIn.

PRODUCT KNOWLEDGE:
- Gita VSL / 1-on-1 Booking Funnel: A VSL that leads to a paid discovery session (₹500 deposit → ₹50k coaching). Gita wisdom applied through neuroscience. Funnel: Lead → Neural Dissonance Assessment → VSL → Booking. Target: Doctors, lawyers, retired professionals 40–65.
- Neuro-Acoustic Protocol (NAP): A proprietary protocol developed and self-tested for 20+ years working on sympathetic/parasympathetic nervous system balance. Not therapy. Not yoga. Scientific + spiritual.
- Neural Dissonance Assessment: A free 2-minute quiz diagnosing 7 domains of SNS dominance. Top-of-funnel entry point.
- VidaPulse: A wellness analytics SaaS for coaches, clinics, agencies to track client progress.
- AI Gita Mentor: An AI chatbot trained on GND's teachings. Answers the way he would. For spiritual seekers and professionals curious about Gita. This is the ONLY product where Gita, Sanskrit references, and spiritual language are appropriate.
- Divine Leads Agency Account: Done-for-you CRM + funnel platform (GoHighLevel white-label) for ₹5,000/month with 40% recurring affiliate.

AUDIENCE PAIN POINTS:
Doctors: Trained clinical detachment that won't turn off at home. Body keeps score of decades of patient suffering. White coat is identity — nothing without it. Missed children's childhoods. Success visible. Suffering invisible and inadmissible.
Lawyers: Adversarial by design — nervous system never leaves fight mode. Preparing for worst case professionally; can't stop doing it personally. Cynicism from processing injustice daily. Intellect has no protocol for their own emotional life.
Retired Professionals: Identity was the role. Role is gone. Dream trip taken but not present for a moment. Stillness is suffocating. Regret loops. Grandchildren exhaust them in an hour. They feel guilty.
Working Professionals: Achieving everything. Feeling nothing. Wins don't land. Body doesn't celebrate. Mind won't switch off at night. Performance declining — it's not discipline.
Agency Owners/Coaches: Fragmented tech stack. Tools don't talk to each other. Want recurring revenue. Clients need better analytics tracking.

SCIENCE CHAIN (weave naturally — never state explicitly as a list):
Purpose Misalignment → Chronic Stress → High-Beta Brain Lock (14–35 Hz, can't slow down) → SNS Dominance (fight/flight always ON) → PNS Suppressed (can't rest, restore, feel) → Downstream symptoms: emotional numbness, relationship distance, decision fatigue, sensory flatness, unexplained physical symptoms, loss of meaning, identity confusion.
Scripts name the symptom (downstream), imply the chain, offer the protocol as the solution. Never diagnose. Never claim to cure.

SCRIPT FORMATS:
- Short Ad (30–40 sec, 70–90 words): Hook → Pain → Reframe (this isn't a mindset problem) → CTA
- Medium Ad (45–60 sec, 110–140 words): Hook → Story beat (one relatable life moment, third-person) → Science bridge (plain language) → Protocol mention → CTA
- VSL Hook (60–90 sec, 150–200 words): Opens on deathbed-style question or identity disruption → builds → ends with: "If this makes sense, watch what I'm about to show you."

CTA POOL (rotate — NEVER repeat the same CTA within a single batch):
1. "Take the Neural Dissonance Assessment. Two minutes. The map is free. Link below."
2. "Book a private 1-on-1 session with me. The link is below. Limited slots."
3. "Click the link below. Take the assessment. Find out exactly where your system is."
4. "There is a way to close this loop. The assessment will show you where to start. Link below."
5. "Book a call with me. One conversation can map the entire thing. Link below."
6. "This is what the assessment reveals. Click below and take it now."
7. "One session. I'll show you exactly what's running. Link below."
8. "The assessment takes two minutes. What it shows you — will stay with you. Click below."
9. "Find out where your nervous system is. Assessment link below. It's free."
10. "This protocol has been running for 20 years. The first step is the assessment. Link below."

PLATFORM TONE:
- Facebook/Instagram: Emotional, visceral hooks. Story-forward. Older Facebook demographic responds best to purpose, relationships, retirement themes.
- LinkedIn: Peer register. More measured. Clinical framing preferred. No emotional excess.
- Instagram: Punchy, immediate, high-energy open. Shorter sentences.

ABSOLUTE RULES:
1. NEVER use motivational language. No "unlock", "transform", "change your life", "potential", "journey", "empower."
2. No spiritual jargon UNLESS product is AI Gita Mentor. No Sanskrit. No yoga. No meditation references.
3. Short sentences. One idea per sentence. Pause-friendly for voiceover.
4. Hooks must be visceral — a moment the viewer LIVES IN, not a question directed at them.
5. NEVER fabricate testimonials. Pattern-based third-person ONLY ("A retired IAS officer once said to me...", "A doctor walked into my session...").
6. Never preach. Never moralize. Reflect. The voice knows something. Quiet confidence, not urgency.
7. Each script ends with a UNIQUE CTA — different from every other script in the same batch.
8. End each script with a HeyGen production note covering wardrobe, camera, pacing, and energy.

OUTPUT FORMAT — use EXACTLY this structure for each script (the separators and labels are required for parsing):
─────────────────────────────────────────
SCRIPT [N] | [Audience] | [Format] | [Platform]
─────────────────────────────────────────

HOOK
"[hook line — 5–10 words, visceral]"

BODY
[script body — line breaks between each sentence, pause-friendly]

CTA
[call to action — 1–3 lines]

PRODUCTION NOTE
Wardrobe: [specific suggestion]
Camera: [angle and movement]
Pacing: [tempo guidance]
Energy: [performance direction]

Word count: [N] | Duration: ~[X] seconds
─────────────────────────────────────────`;

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt({ mode, product, audience, format, platform, quantity, hookInput, pastedScript, hookCount }) {
  const pLabel = PRODUCTS.find((p) => p.id === product)?.label || product;
  const aLabel = AUDIENCES.find((a) => a.id === audience)?.label || audience;
  const fLabel = FORMATS.find((f) => f.id === format)?.label || format;
  const plLabel = PLATFORMS.find((p) => p.id === platform)?.label || platform;

  if (mode === "generate") {
    return `Generate ${quantity} video ad script${quantity > 1 ? "s" : ""} with these parameters:

Product: ${pLabel}
Audience: ${aLabel}
Format: ${fLabel}
Platform: ${plLabel}

Requirements:
- Each script MUST have a completely different hook — different emotional angle, different opening moment
- Each script MUST use a different CTA from the CTA pool — never repeat within this batch
- Follow the exact output format: separator lines, HOOK / BODY / CTA / PRODUCTION NOTE labels
- Number scripts SCRIPT 01, SCRIPT 02, etc.
- Word count must match the format specification${hookInput.trim() ? `\n\nAnchor idea / hook direction to build from:\n"${hookInput.trim()}"` : ""}`;
  }

  if (mode === "hooks") {
    return `Generate ${hookCount} hook lines only for:

Product: ${pLabel}
Audience: ${aLabel}
Platform: ${plLabel}

Hook rules:
- 5–10 words maximum per hook
- Each hook is a visceral moment the viewer LIVES IN — not a question at them
- No two hooks can use the same emotional register or opening device
- No motivational language. No "Are you..." questions.
- Variety: some open on a physical sensation, some on a memory, some on a contrast, some on an observation

Output format — numbered list only. No explanations or script copy.

1.
2.
3. [etc.]`;
  }

  if (mode === "rewrite") {
    return `Rewrite the following script with a DIFFERENT hook and a DIFFERENT CTA. Keep the same audience, product, and approximate format length. Maintain all tone rules — short sentences, no motivational language, quiet confidence.

ORIGINAL SCRIPT:
${pastedScript}
${hookInput.trim() ? `\nDirection for the new hook:\n"${hookInput.trim()}"` : ""}

Output using the standard script format with separator lines and section labels.`;
  }

  if (mode === "adapt") {
    return `Take the following script and produce 3 platform-specific versions:

PLATFORM 1 — Facebook: Emotional, visceral, story-forward. Older demographic. Purpose and relationship themes land well.
PLATFORM 2 — LinkedIn: Peer register. Measured. Clinical framing. No emotional excess. Professional equals speaking.
PLATFORM 3 — Instagram: Punchy, immediate. Highest-energy open of the three. Shortest sentences.

Each version should feel like it was written FOR that platform, not adapted to it.

ORIGINAL SCRIPT:
${pastedScript}

For each version use the standard output format. Label headers: SCRIPT 1 | [Audience] | [Format] | Facebook, etc.`;
  }

  if (mode === "validate") {
    return `Validate the following script against Neuro-Acoustic Protocol standards.

SCRIPT TO VALIDATE:
${pastedScript}

Score on each dimension:
1. HOOK STRENGTH (1–5): Is it visceral? Does the viewer live in the moment or is it a generic question?
2. PAIN SPECIFICITY (1–5): Does it name a recognizable, specific pain state — or is it vague?
3. SCIENCE BRIDGE (Y/N): Is the SNS/PNS chain implied or explained in plain language?
4. CTA CLARITY (1–5): Is the action unambiguous and the reason to act stated?
5. TONE COMPLIANCE (Y/N): Does it avoid motivational language, preachiness, and spiritual jargon?

Output format (use exactly):
HOOK STRENGTH: [score]/5 — [one specific reason]
PAIN SPECIFICITY: [score]/5 — [one specific reason]
SCIENCE BRIDGE: [Y/N] — [one specific reason]
CTA CLARITY: [score]/5 — [one specific reason]
TONE COMPLIANCE: [Y/N] — [one specific reason]
─────────────────────
OVERALL: [total]/22
─────────────────────
IMPROVEMENT: [one specific, actionable rewrite suggestion — quote the exact line to change and show the improved version]`;
  }

  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT PARSER
// ─────────────────────────────────────────────────────────────────────────────
function parseScripts(text) {
  const scripts = [];
  // Split on the separator lines
  const blocks = text.split(/─{5,}/g);

  let current = null;
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^(SCRIPT\s+\d+[^\n]*)/m);
    if (headerMatch) {
      if (current) scripts.push(current);
      current = {
        header: headerMatch[1].trim(),
        hook: "",
        body: "",
        cta: "",
        productionNote: "",
        meta: "",
        raw: trimmed,
      };

      const hookMatch = trimmed.match(/\bHOOK\b\s*\n([\s\S]*?)(?=\n\bBODY\b|\n\bCTA\b|\n\bPRODUCTION\b|$)/i);
      const bodyMatch = trimmed.match(/\bBODY\b\s*\n([\s\S]*?)(?=\n\bCTA\b|\n\bPRODUCTION\b|$)/i);
      const ctaMatch = trimmed.match(/\bCTA\b\s*\n([\s\S]*?)(?=\n\bPRODUCTION\b|Word count:|$)/i);
      const prodMatch = trimmed.match(/\bPRODUCTION NOTE\b\s*\n([\s\S]*?)(?=Word count:|$)/i);
      const metaMatch = trimmed.match(/(Word count:.*)/i);

      if (hookMatch) current.hook = hookMatch[1].trim();
      if (bodyMatch) current.body = bodyMatch[1].trim();
      if (ctaMatch) current.cta = ctaMatch[1].trim();
      if (prodMatch) current.productionNote = prodMatch[1].trim();
      if (metaMatch) current.meta = metaMatch[1].trim();
    }
  }
  if (current) scripts.push(current);

  // Fallback: return raw output as one block
  if (scripts.length === 0 && text.trim()) {
    scripts.push({
      header: "Output",
      hook: "",
      body: "",
      cta: "",
      productionNote: "",
      meta: "",
      raw: text,
    });
  }

  return scripts;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: C.textMid,
        marginBottom: "7px",
        fontFamily: FONTS.body,
      }}
    >
      {children}
    </div>
  );
}

function StyledSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        backgroundColor: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "9px 34px 9px 11px",
        fontSize: "13px",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236a6a7a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 11px center",
        fontFamily: FONTS.body,
      }}
    >
      {children}
    </select>
  );
}

function StyledTextarea({ value, onChange, placeholder, minHeight = 80 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        backgroundColor: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "10px 11px",
        fontSize: "13px",
        outline: "none",
        resize: "vertical",
        minHeight: `${minHeight}px`,
        lineHeight: 1.6,
        fontFamily: FONTS.body,
        boxSizing: "border-box",
        placeholderColor: C.textDim,
      }}
    />
  );
}

function QtyButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        backgroundColor: active ? C.gold : C.surface,
        color: active ? "#0f0f0f" : C.textMid,
        border: `1px solid ${active ? C.gold : C.border}`,
        borderRadius: "5px",
        padding: "8px 4px",
        fontSize: "14px",
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        textAlign: "center",
        fontFamily: FONTS.body,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ModeTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "7px 3px",
        backgroundColor: active ? C.goldDim : "transparent",
        color: active ? C.gold : C.textDim,
        border: `1px solid ${active ? C.gold : "transparent"}`,
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        textAlign: "center",
        letterSpacing: "0.03em",
        fontFamily: FONTS.body,
        transition: "all 0.15s",
        lineHeight: 1.3,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ScriptCard({ script, idx, mode, onCopy, copied }) {
  const isRaw = mode !== "generate" || !script.hook;

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        padding: "24px 26px",
        marginBottom: "18px",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: C.textDim,
          }}
        >
          {script.header}
        </div>
        <button
          onClick={() => onCopy(idx, isRaw ? script.raw : `${script.hook}\n\n${script.body}\n\n${script.cta}\n\nPRODUCTION NOTE\n${script.productionNote}\n\n${script.meta}`)}
          style={{
            backgroundColor: copied ? C.goldDim : "transparent",
            color: copied ? C.gold : C.textDim,
            border: `1px solid ${copied ? C.gold : C.border}`,
            borderRadius: "4px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.body,
            letterSpacing: "0.05em",
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      {/* Raw output (hooks / validate / adapt / rewrite) */}
      {isRaw && (
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "14px",
            color: C.text,
            lineHeight: 1.85,
            fontFamily: FONTS.body,
          }}
        >
          {script.raw}
        </div>
      )}

      {/* Structured script */}
      {!isRaw && (
        <>
          {/* Hook */}
          {script.hook && (
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, marginBottom: "8px", fontFamily: FONTS.body }}>
                Hook
              </div>
              <div
                style={{
                  fontFamily: FONTS.heading,
                  fontSize: "17px",
                  color: C.gold,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                {script.hook}
              </div>
            </div>
          )}

          <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />

          {/* Body */}
          {script.body && (
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textDim, marginBottom: "8px", fontFamily: FONTS.body }}>
                Body
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: C.text,
                  lineHeight: 1.9,
                  whiteSpace: "pre-line",
                  fontFamily: FONTS.body,
                }}
              >
                {script.body}
              </div>
            </div>
          )}

          {script.cta && (
            <>
              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.saffron, marginBottom: "8px", fontFamily: FONTS.body }}>
                  CTA
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: C.saffron,
                    lineHeight: 1.7,
                    fontWeight: 500,
                    whiteSpace: "pre-line",
                    fontFamily: FONTS.body,
                  }}
                >
                  {script.cta}
                </div>
              </div>
            </>
          )}

          {script.productionNote && (
            <>
              <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textVeryDim, marginBottom: "8px", fontFamily: FONTS.body }}>
                  HeyGen Production Note
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: C.textDim,
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                    fontFamily: FONTS.body,
                  }}
                >
                  {script.productionNote}
                </div>
              </div>
            </>
          )}

          {script.meta && (
            <div
              style={{
                fontSize: "11px",
                color: C.textVeryDim,
                letterSpacing: "0.05em",
                fontFamily: FONTS.body,
                marginTop: "8px",
              }}
            >
              {script.meta}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoScriptGenerator() {
  // Controls
  const [mode, setMode] = useState("generate");
  const [product, setProduct] = useState("gita_vsl");
  const [audience, setAudience] = useState("doctors");
  const [format, setFormat] = useState("short");
  const [platform, setPlatform] = useState("facebook");
  const [quantity, setQuantity] = useState(3);
  const [hookInput, setHookInput] = useState("");
  const [hookCount, setHookCount] = useState(10);
  const [pastedScript, setPastedScript] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Output
  const [generating, setGenerating] = useState(false);
  const [scripts, setScripts] = useState([]);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);

  // ── Generate ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Enter your Claude API key to continue.");
      return;
    }
    if ((mode === "rewrite" || mode === "adapt" || mode === "validate") && !pastedScript.trim()) {
      setError("Paste a script first.");
      return;
    }

    setGenerating(true);
    setError("");
    setScripts([]);

    const userPrompt = buildPrompt({ mode, product, audience, format, platform, quantity, hookInput, pastedScript, hookCount });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      const parsed = mode === "generate" ? parseScripts(text) : [{ header: MODE_LABEL[mode], hook: "", body: "", cta: "", productionNote: "", meta: "", raw: text }];
      setScripts(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  }, [mode, product, audience, format, platform, quantity, hookInput, pastedScript, hookCount, apiKey]);

  const MODE_LABEL = {
    hooks: "Generated Hooks",
    rewrite: "Rewritten Script",
    adapt: "Platform Adaptations",
    validate: "Script Validation",
  };

  // ── Copy ──────────────────────────────────────────────────────
  const handleCopy = useCallback((idx, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  // ── Export ────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const full = scripts
      .map((s) =>
        s.raw ||
        [
          `─────────────────────────────────────────`,
          s.header,
          `─────────────────────────────────────────`,
          "",
          "HOOK",
          s.hook,
          "",
          "BODY",
          s.body,
          "",
          "CTA",
          s.cta,
          "",
          "PRODUCTION NOTE",
          s.productionNote,
          "",
          s.meta,
        ].join("\n")
      )
      .join("\n\n");

    const blob = new Blob([full], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nap-scripts-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [scripts]);

  // ── Mode change ───────────────────────────────────────────────
  const handleModeChange = (m) => {
    setMode(m);
    setScripts([]);
    setError("");
  };

  const needsPaste = mode === "rewrite" || mode === "adapt" || mode === "validate";
  const showProductAudience = mode === "generate" || mode === "hooks";
  const showFormatPlatform = mode === "generate";
  const btnLabel = generating
    ? "Writing…"
    : mode === "generate"
    ? `Generate ${quantity} Script${quantity !== 1 ? "s" : ""}`
    : MODES.find((m) => m.id === mode)?.label || "Generate";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: #0f0f0f; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #252535; border-radius: 3px; }
        select option { background: #141828 !important; color: #F5F0E8; }
        input::placeholder, textarea::placeholder { color: #3a3a4a; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          color: C.text,
          fontFamily: FONTS.body,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── HEADER ── */}
        <header
          style={{
            borderBottom: `1px solid ${C.border}`,
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0a0a0a",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.heading,
                fontSize: "18px",
                fontWeight: 600,
                color: C.text,
                letterSpacing: "0.02em",
              }}
            >
              Script Generator
            </div>
            <div
              style={{
                fontSize: "10px",
                color: C.textDim,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Neuro-Acoustic Protocol · Neural Dissonance Assessment Funnel
            </div>
          </div>

          {/* Status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: generating ? C.saffron : scripts.length ? C.gold : C.textVeryDim,
                boxShadow: generating
                  ? `0 0 10px ${C.saffron}`
                  : scripts.length
                  ? `0 0 8px ${C.gold}88`
                  : "none",
                animation: generating ? "pulse-dot 1s ease-in-out infinite" : "none",
                transition: "all 0.3s",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: generating ? C.saffron : scripts.length ? C.gold : C.textVeryDim,
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              {generating ? "GENERATING" : scripts.length ? "READY" : "IDLE"}
            </span>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 57px)" }}>
          {/* ── LEFT PANEL ── */}
          <aside
            style={{
              width: "300px",
              minWidth: "300px",
              backgroundColor: "#0a0a0a",
              borderRight: `1px solid ${C.border}`,
              overflowY: "auto",
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Mode */}
            <div>
              <FieldLabel>Mode</FieldLabel>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {MODES.map((m) => (
                  <ModeTab key={m.id} active={mode === m.id} onClick={() => handleModeChange(m.id)}>
                    {m.label}
                  </ModeTab>
                ))}
              </div>
            </div>

            {/* Product */}
            {showProductAudience && (
              <div>
                <FieldLabel>Product</FieldLabel>
                <StyledSelect value={product} onChange={(e) => setProduct(e.target.value)}>
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </StyledSelect>
              </div>
            )}

            {/* Audience */}
            {showProductAudience && (
              <div>
                <FieldLabel>Audience</FieldLabel>
                <StyledSelect value={audience} onChange={(e) => setAudience(e.target.value)}>
                  {AUDIENCES.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </StyledSelect>
              </div>
            )}

            {/* Format */}
            {showFormatPlatform && (
              <div>
                <FieldLabel>Format</FieldLabel>
                <StyledSelect value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label} — {f.sub}</option>
                  ))}
                </StyledSelect>
              </div>
            )}

            {/* Platform */}
            {showFormatPlatform && (
              <div>
                <FieldLabel>Platform</FieldLabel>
                <StyledSelect value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </StyledSelect>
              </div>
            )}

            {/* Quantity */}
            {mode === "generate" && (
              <div>
                <FieldLabel>Quantity</FieldLabel>
                <div style={{ display: "flex", gap: "6px" }}>
                  {QUANTITIES.map((q) => (
                    <QtyButton key={q} active={quantity === q} onClick={() => setQuantity(q)}>
                      {q}
                    </QtyButton>
                  ))}
                </div>
              </div>
            )}

            {/* Hook count */}
            {mode === "hooks" && (
              <div>
                <FieldLabel>Number of Hooks</FieldLabel>
                <div style={{ display: "flex", gap: "6px" }}>
                  {HOOK_COUNTS.map((q) => (
                    <QtyButton key={q} active={hookCount === q} onClick={() => setHookCount(q)}>
                      {q}
                    </QtyButton>
                  ))}
                </div>
              </div>
            )}

            {/* Hook anchor (generate + rewrite) */}
            {(mode === "generate" || mode === "rewrite") && (
              <div>
                <FieldLabel>
                  {mode === "rewrite" ? "New Hook Direction" : "Hook Anchor (Optional)"}
                </FieldLabel>
                <StyledTextarea
                  value={hookInput}
                  onChange={(e) => setHookInput(e.target.value)}
                  placeholder={
                    mode === "rewrite"
                      ? "Direction for the new hook…"
                      : "Paste a pain point, story, or hook idea to anchor generation…"
                  }
                />
              </div>
            )}

            {/* Pasted script */}
            {needsPaste && (
              <div>
                <FieldLabel>
                  {mode === "validate" ? "Script to Validate" : mode === "adapt" ? "Script to Adapt" : "Script to Rewrite"}
                </FieldLabel>
                <StyledTextarea
                  value={pastedScript}
                  onChange={(e) => setPastedScript(e.target.value)}
                  placeholder="Paste the full script here…"
                  minHeight={160}
                />
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${C.border}` }} />

            {/* API Key */}
            <div>
              <FieldLabel>Claude API Key</FieldLabel>
              <div style={{ position: "relative" }}>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-…"
                  style={{
                    width: "100%",
                    backgroundColor: C.surface,
                    color: C.text,
                    border: `1px solid ${apiKey ? C.gold + "66" : C.border}`,
                    borderRadius: "6px",
                    padding: "9px 48px 9px 11px",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: FONTS.body,
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.textDim,
                    fontSize: "10px",
                    letterSpacing: "0.05em",
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                  }}
                >
                  {showKey ? "HIDE" : "SHOW"}
                </button>
              </div>
              <div style={{ fontSize: "10px", color: C.textVeryDim, marginTop: "5px", lineHeight: 1.4 }}>
                Used client-side only. Never stored or transmitted elsewhere.
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: "100%",
                backgroundColor: generating ? C.gold + "88" : C.gold,
                color: "#0c0c0c",
                border: "none",
                borderRadius: "6px",
                padding: "13px 20px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: generating ? "not-allowed" : "pointer",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                fontFamily: FONTS.body,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {generating && (
                <div
                  style={{
                    width: "13px",
                    height: "13px",
                    border: "2px solid #0c0c0c44",
                    borderTop: "2px solid #0c0c0c",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
              {btnLabel}
            </button>

            {/* Export */}
            {scripts.length > 0 && (
              <button
                onClick={handleExport}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  color: C.gold,
                  border: `1px solid ${C.gold}`,
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: FONTS.body,
                }}
              >
                Export as .txt
              </button>
            )}
          </aside>

          {/* ── RIGHT PANEL ── */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "28px 32px",
              backgroundColor: C.bg,
            }}
          >
            {/* Error */}
            {error && (
              <div
                style={{
                  backgroundColor: C.errorBg,
                  border: `1px solid ${C.errorBorder}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  color: C.error,
                  fontFamily: FONTS.body,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, marginRight: "8px" }}>Error</span>
                {error}
              </div>
            )}

            {/* Empty state */}
            {!generating && scripts.length === 0 && !error && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "20px",
                  opacity: 0.45,
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                  }}
                >
                  🎬
                </div>
                <div style={{ fontFamily: FONTS.heading, fontSize: "20px", color: C.text }}>
                  Ready to generate
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: C.textDim,
                    textAlign: "center",
                    maxWidth: "320px",
                    lineHeight: 1.7,
                  }}
                >
                  Configure product, audience, format, and platform on the left — then click Generate.
                </div>
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: `2px solid ${C.border}`,
                    borderTop: `2px solid ${C.gold}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div style={{ fontFamily: FONTS.heading, fontSize: "18px", color: C.gold }}>
                  Writing scripts…
                </div>
                <div style={{ fontSize: "12px", color: C.textDim, letterSpacing: "0.05em" }}>
                  This takes 15–40 seconds depending on quantity
                </div>
              </div>
            )}

            {/* Generated scripts */}
            {!generating && scripts.length > 0 && (
              <>
                {/* Output header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: FONTS.heading, fontSize: "20px", color: C.text }}>
                      {scripts.length === 1 && mode !== "generate"
                        ? MODE_LABEL[mode]
                        : `${scripts.length} Script${scripts.length !== 1 ? "s" : ""} Generated`}
                    </div>
                    <div style={{ fontSize: "11px", color: C.textDim, marginTop: "3px", letterSpacing: "0.05em" }}>
                      {PRODUCTS.find((p) => p.id === product)?.label} ·{" "}
                      {AUDIENCES.find((a) => a.id === audience)?.label} ·{" "}
                      {PLATFORMS.find((p) => p.id === platform)?.label}
                    </div>
                  </div>
                  <button
                    onClick={() => { setScripts([]); setError(""); }}
                    style={{
                      backgroundColor: "transparent",
                      color: C.textDim,
                      border: `1px solid ${C.border}`,
                      borderRadius: "5px",
                      padding: "6px 14px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: FONTS.body,
                      letterSpacing: "0.05em",
                    }}
                  >
                    Clear
                  </button>
                </div>

                {/* Script cards */}
                {scripts.map((script, idx) => (
                  <ScriptCard
                    key={idx}
                    script={script}
                    idx={idx}
                    mode={mode}
                    onCopy={handleCopy}
                    copied={copiedIdx === idx}
                  />
                ))}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE NOTES
// ─────────────────────────────────────────────────────────────────────────────
// Claude.ai Artifacts: remove the React import lines at the top.
// Vite / CRA: import and use as a route, e.g. <Route path="/scripts" element={<VideoScriptGenerator />} />
// API key: obtain from https://console.anthropic.com — the key is only used in your browser.
// Model: claude-sonnet-4-5 (update to latest Sonnet if needed)
