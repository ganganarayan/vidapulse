'use strict';

/**
 * Knowledge Base — inline SVG diagrams (on-brand, crawlable).
 *
 * Each function returns a <figure> with an <svg> using the cream/brown
 * palette. role="img" + <title>/<desc> for accessibility and so crawlers
 * read the meaning. No external requests, no script — CSP-safe.
 */

const INK = '#33271A', BODY = '#7A6A59', LINE = '#E4D8C2', ACCENT = '#E0822E', AREA = '#F3E2CF';

function fig(svg, caption) {
  return `<figure class="kb-fig">${svg}<figcaption>${caption}</figcaption></figure>`;
}

// Declining audience-retention curve with marked drop-off points.
function retentionCurve(caption = 'A typical VSL retention curve — the steepest losses come early and right before the offer.') {
  const pts = '70,30 89,76 132,110 225,139 318,160 411,177 504,188 597,196 690,202';
  const svg = `<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="rc-t rc-d">
  <title id="rc-t">Audience retention curve</title>
  <desc id="rc-d">A line falling from 100 percent at the start to about 18 percent by the offer, with the sharpest drops in the first few seconds and just before the offer.</desc>
  <line x1="70" y1="30" x2="70" y2="240" stroke="${LINE}"/>
  <line x1="70" y1="240" x2="690" y2="240" stroke="${LINE}"/>
  <line x1="70" y1="135" x2="690" y2="135" stroke="${LINE}" stroke-dasharray="3 5"/>
  <text x="62" y="34" text-anchor="end" font-size="12" fill="${BODY}">100%</text>
  <text x="62" y="139" text-anchor="end" font-size="12" fill="${BODY}">50%</text>
  <text x="62" y="243" text-anchor="end" font-size="12" fill="${BODY}">0%</text>
  <polygon points="70,240 ${pts} 690,240" fill="${AREA}"/>
  <polyline points="${pts}" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="89" y1="30" x2="89" y2="240" stroke="${ACCENT}" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="95" y="48" font-size="12" fill="${INK}">First seconds</text>
  <line x1="504" y1="30" x2="504" y2="240" stroke="${ACCENT}" stroke-width="1" stroke-dasharray="2 4"/>
  <text x="498" y="48" text-anchor="end" font-size="12" fill="${INK}">Offer appears</text>
  <text x="380" y="248" text-anchor="middle" font-size="12" fill="${BODY}" dy="14">Video timeline →</text>
</svg>`;
  return fig(svg, caption);
}

// Second-by-second engagement heatmap strip.
function heatmapStrip(caption = 'A heatmap shows attention second by second — dark bands are replayed, faint bands are skipped.') {
  const intensity = [0.9,0.85,0.7,0.6,0.55,0.5,0.42,0.35,0.3,0.28,0.22,0.18,0.16,0.2,0.45,0.7,0.62,0.4,0.3,0.26,0.22,0.2,0.5,0.66];
  const x0 = 70, w = 620, n = intensity.length, cw = w / n;
  const cells = intensity.map((a, i) => {
    const x = (x0 + i * cw).toFixed(1);
    return `<rect x="${x}" y="40" width="${(cw - 1).toFixed(1)}" height="56" fill="${ACCENT}" fill-opacity="${a.toFixed(2)}"/>`;
  }).join('');
  const svg = `<svg viewBox="0 0 720 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="hm-t hm-d">
  <title id="hm-t">Engagement heatmap</title>
  <desc id="hm-d">A horizontal strip divided into segments; darker segments are watched and replayed more, lighter segments are skipped.</desc>
  <rect x="${x0}" y="40" width="${w}" height="56" fill="${AREA}"/>
  ${cells}
  <text x="${x0}" y="116" font-size="12" fill="${BODY}">Start</text>
  <text x="${x0 + w}" y="116" text-anchor="end" font-size="12" fill="${BODY}">End of video</text>
  <text x="${x0}" y="28" font-size="12" fill="${INK}">Most replayed</text>
  <text x="${x0 + w}" y="28" text-anchor="end" font-size="12" fill="${BODY}">Skipped</text>
</svg>`;
  return fig(svg, caption);
}

// Shrinking conversion funnel: play → offer → buy.
function conversionFunnel(caption = 'In most funnels the biggest leak is between pressing play and reaching the offer — not the offer itself.') {
  const rows = [
    { label: 'Pressed play', pct: 1.0, val: '100%' },
    { label: 'Reached the offer', pct: 0.2, val: '~20%' },
    { label: 'Bought / booked', pct: 0.03, val: '~3%' },
  ];
  const x0 = 210, w = 470;
  const bars = rows.map((r, i) => {
    const y = 30 + i * 66;
    const bw = Math.max(r.pct * w, 6).toFixed(1);
    return `<text x="195" y="${y + 27}" text-anchor="end" font-size="14" fill="${INK}">${r.label}</text>
  <rect x="${x0}" y="${y}" width="${w}" height="42" rx="4" fill="${AREA}"/>
  <rect x="${x0}" y="${y}" width="${bw}" height="42" rx="4" fill="${ACCENT}"/>
  <text x="${(x0 + Number(bw) + 10).toFixed(1)}" y="${y + 27}" font-size="13" fill="${BODY}">${r.val}</text>`;
  }).join('\n  ');
  const svg = `<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="cf-t cf-d">
  <title id="cf-t">Video conversion funnel</title>
  <desc id="cf-d">Three bars shrinking from 100 percent who pressed play, to about 20 percent who reached the offer, to about 3 percent who bought.</desc>
  ${bars}
</svg>`;
  return fig(svg, caption);
}

module.exports = { retentionCurve, heatmapStrip, conversionFunnel };
