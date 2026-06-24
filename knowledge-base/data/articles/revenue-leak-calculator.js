'use strict';

module.exports = {
  metaTitle: 'Revenue Leak Calculator for Video Funnels | VidaPulse',
  metaDescription:
    'Free revenue leak calculator: estimate how much money your video loses to drop-off before the offer, and what you would earn by improving retention. No signup.',
  answer:
    'The revenue leak calculator estimates how much money your video loses to drop-off before the offer. Enter your monthly plays, the share of viewers who reach your offer, your conversion rate at the offer, and your average order value, and it returns your current revenue, the viewers lost before the offer, and the extra revenue you would earn by lifting retention to a target. It is a model, not a measurement — use it to size the opportunity, then measure the real numbers on your own video.',
  tool: {
    name: 'Revenue leak calculator',
    script: 'revenue-leak-calc.js',
    html: `      <div class="kb-calc" id="rlc">
        <div class="kb-calc-row"><label for="rlc-plays">Monthly viewers (plays)</label><input class="kb-calc-num" id="rlc-plays" type="number" value="2000" min="0" step="100" /></div>
        <div class="kb-calc-row"><label for="rlc-aov">Average order value (USD)</label><input class="kb-calc-num" id="rlc-aov" type="number" value="500" min="0" step="10" /></div>
        <div class="kb-calc-row"><label for="rlc-now">Reach your offer now</label><input id="rlc-now" type="range" min="1" max="100" value="25" step="1" /><span class="kb-calc-val" id="rlc-now-v">25%</span></div>
        <div class="kb-calc-row"><label for="rlc-conv">Conversion at the offer</label><input id="rlc-conv" type="range" min="1" max="50" value="8" step="1" /><span class="kb-calc-val" id="rlc-conv-v">8%</span></div>
        <div class="kb-calc-row"><label for="rlc-tgt">Target reach after fixing retention</label><input id="rlc-tgt" type="range" min="1" max="100" value="45" step="1" /><span class="kb-calc-val" id="rlc-tgt-v">45%</span></div>
        <div class="kb-calc-results">
          <div class="kb-calc-card"><div class="kb-calc-label">Revenue now</div><div class="kb-calc-figure" id="rlc-rev">$20,000/mo</div></div>
          <div class="kb-calc-card"><div class="kb-calc-label">Viewers lost before the offer</div><div class="kb-calc-figure" id="rlc-lost">1,500/mo</div></div>
          <div class="kb-calc-card kb-calc-hl"><div class="kb-calc-label">Extra revenue at target</div><div class="kb-calc-figure" id="rlc-extra">+$16,000/mo</div><div class="kb-calc-label" id="rlc-extra-yr">+$192,000 / year</div></div>
        </div>
        <div class="kb-calc-note">Your numbers stay in your browser — nothing is stored. Illustrative model: it assumes viewers who reach the offer convert at the rate you enter.</div>
      </div>`,
    scriptSource: `(function(){
  var g=function(i){return document.getElementById(i);};
  if(!g('rlc-plays'))return;
  var usd=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  var nf=new Intl.NumberFormat('en-US');
  function calc(){
    var plays=Math.max(0,+g('rlc-plays').value||0), aov=Math.max(0,+g('rlc-aov').value||0);
    var now=+g('rlc-now').value, conv=+g('rlc-conv').value, tgt=+g('rlc-tgt').value;
    g('rlc-now-v').textContent=now+'%'; g('rlc-conv-v').textContent=conv+'%'; g('rlc-tgt-v').textContent=tgt+'%';
    var revNow=plays*(now/100)*(conv/100)*aov;
    var lost=plays*(1-now/100);
    var extra=plays*((tgt-now)/100)*(conv/100)*aov;
    var s=extra>=0?'+':'';
    g('rlc-rev').textContent=usd.format(Math.round(revNow))+'/mo';
    g('rlc-lost').textContent=nf.format(Math.round(lost))+'/mo';
    g('rlc-extra').textContent=s+usd.format(Math.round(extra))+'/mo';
    g('rlc-extra-yr').textContent=s+usd.format(Math.round(extra*12))+' / year';
  }
  ['rlc-plays','rlc-aov','rlc-now','rlc-conv','rlc-tgt'].forEach(function(id){var e=g(id);if(e){e.addEventListener('input',calc);e.addEventListener('change',calc);}});
  calc();
})();`,
  },
  sections: [
    {
      h2: 'How the calculation works',
      html: `<p>The model is a simple funnel chain. Monthly revenue from the video equals your monthly plays, multiplied by the share of viewers who reach the offer, multiplied by the conversion rate among those who reach it, multiplied by your average order value.</p>
      <p>The leak is the money you would recover by getting more viewers to the offer at the same conversion rate. Extra revenue equals monthly plays, multiplied by the gap between your target reach and your current reach, multiplied by the conversion rate, multiplied by the average order value.</p>
      <ul class="kb-list"><li><strong>Revenue now</strong> = plays x reach now x conversion x order value</li><li><strong>Extra revenue</strong> = plays x (target reach minus current reach) x conversion x order value</li></ul>`,
    },
    {
      h2: 'A worked example',
      html: `<p class="kb-example">Example (illustrative figures, not real data): 2,000 plays a month, 25% reach the offer, 8% of those buy, and the average order is 500 dollars. That is 2,000 x 0.25 x 0.08 x 500 = 20,000 dollars a month, and 1,500 viewers leave before the offer. Lift reach from 25% to 45% and you add roughly 16,000 dollars a month — about 192,000 dollars a year — from the same traffic and the same offer.</p>`,
    },
    {
      h2: 'Why drop-off, not the offer, is usually the leak',
      html: `<p>When a video underperforms, the instinct is to rewrite the offer or cut the price. But if only a quarter of viewers ever reach the offer, three quarters of your traffic never hears it — so the offer was never the bottleneck. Getting more of the people you already paid to acquire to the offer is almost always the cheaper, larger win, and it is the lever this calculator sizes.</p>`,
    },
  ],
  solve: `<p>The one number you have to estimate above — the share of viewers who actually reach your offer — is the number VidaPulse measures exactly. Wrap your existing video (no re-hosting), and the retention curve plus second-by-second heatmap show the real percentage reaching any point, including your offer and your call to action. Replace the slider with your true figure, fix the biggest drop before the offer, and watch the number climb.</p>
  <p>Start free, paste your video URL, and turn this estimate into your real revenue-leak number.</p>`,
  faq: [
    { q: 'What counts as "reaching the offer"?', a: 'The point in the video where you make the pitch or show the call to action. The percentage of viewers still watching at that timestamp is your reach-to-offer — the metric this calculator multiplies through.' },
    { q: 'Is the calculator accurate?', a: 'It is a model, so it is only as good as your inputs. The reach-to-offer figure is the one people guess wrong most often. Measure it on your real video and the estimate becomes a real number.' },
    { q: 'Do you store the numbers I enter?', a: 'No. The calculator runs entirely in your browser and nothing is sent anywhere or saved.' },
  ],
};
