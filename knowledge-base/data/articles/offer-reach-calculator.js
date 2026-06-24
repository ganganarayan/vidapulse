'use strict';

module.exports = {
  metaTitle: 'Offer Reach Calculator — How Many Viewers See Your Offer | VidaPulse',
  metaDescription:
    'Free offer reach calculator: see how many viewers actually reach your offer, how many you lose before it, and how many more would see it if you improve retention.',
  answer:
    'The offer reach calculator shows how many of your viewers actually make it to your offer. Enter your monthly plays and the share who currently reach the offer, set a target, and it returns the viewers reaching the offer now, the viewers lost before it, and how many more would see the offer if you lifted retention. Reach-to-offer is the single most predictive video metric for sales, because no one can buy from a pitch they never saw.',
  tool: {
    name: 'Offer reach calculator',
    script: 'offer-reach-calc.js',
    html: `      <div class="kb-calc" id="orc">
        <div class="kb-calc-row"><label for="orc-plays">Monthly viewers (plays)</label><input class="kb-calc-num" id="orc-plays" type="number" value="2000" min="0" step="100" /></div>
        <div class="kb-calc-row"><label for="orc-now">Reach your offer now</label><input id="orc-now" type="range" min="1" max="100" value="25" step="1" /><span class="kb-calc-val" id="orc-now-v">25%</span></div>
        <div class="kb-calc-row"><label for="orc-tgt">Target reach</label><input id="orc-tgt" type="range" min="1" max="100" value="45" step="1" /><span class="kb-calc-val" id="orc-tgt-v">45%</span></div>
        <div class="kb-calc-results">
          <div class="kb-calc-card"><div class="kb-calc-label">Reach the offer now</div><div class="kb-calc-figure" id="orc-now-n">500/mo</div></div>
          <div class="kb-calc-card"><div class="kb-calc-label">Lost before the offer</div><div class="kb-calc-figure" id="orc-lost">1,500/mo</div></div>
          <div class="kb-calc-card kb-calc-hl"><div class="kb-calc-label">Extra viewers reaching the offer</div><div class="kb-calc-figure" id="orc-extra">+400/mo</div><div class="kb-calc-label" id="orc-extra-yr">+4,800 / year</div></div>
        </div>
        <div class="kb-calc-note">Runs in your browser — nothing is stored.</div>
      </div>`,
    scriptSource: `(function(){
  var g=function(i){return document.getElementById(i);};
  if(!g('orc-plays'))return;
  var nf=new Intl.NumberFormat('en-US');
  function calc(){
    var plays=Math.max(0,+g('orc-plays').value||0);
    var now=+g('orc-now').value, tgt=+g('orc-tgt').value;
    g('orc-now-v').textContent=now+'%'; g('orc-tgt-v').textContent=tgt+'%';
    var reachNow=plays*now/100, lost=plays*(1-now/100), extra=plays*(tgt-now)/100;
    var s=extra>=0?'+':'';
    g('orc-now-n').textContent=nf.format(Math.round(reachNow))+'/mo';
    g('orc-lost').textContent=nf.format(Math.round(lost))+'/mo';
    g('orc-extra').textContent=s+nf.format(Math.round(extra))+'/mo';
    g('orc-extra-yr').textContent=s+nf.format(Math.round(extra*12))+' / year';
  }
  ['orc-plays','orc-now','orc-tgt'].forEach(function(id){var e=g(id);if(e){e.addEventListener('input',calc);e.addEventListener('change',calc);}});
  calc();
})();`,
  },
  sections: [
    {
      h2: 'How the calculation works',
      html: `<p>Reach-to-offer is the percentage of viewers still watching when your offer or call to action appears. Multiply your monthly plays by that percentage to get the viewers who actually see the offer; the rest left before it.</p>
      <ul class="kb-list"><li><strong>Reach now</strong> = plays x reach percentage now</li><li><strong>Lost before the offer</strong> = plays x (100% minus reach now)</li><li><strong>Extra viewers at target</strong> = plays x (target reach minus current reach)</li></ul>`,
    },
    {
      h2: 'A worked example',
      html: `<p class="kb-example">Example (illustrative): with 2,000 plays a month and 25% reaching the offer, 500 people see your pitch and 1,500 leave before it. Lift reach to 45% and an extra 400 viewers a month — about 4,800 a year — now hear the offer, before you change a single word of the pitch itself.</p>`,
    },
    {
      h2: 'Why reach-to-offer predicts sales',
      html: `<p>Every other on-page tweak — the price, the guarantee, the button colour — only matters for people who reach the offer. Reach-to-offer caps your entire conversion math. Raising it is usually the highest-leverage change you can make, which is why it is the first number to measure and the one to move first.</p>`,
    },
  ],
  solve: `<p>This calculator asks you to estimate your reach-to-offer. VidaPulse measures it exactly: wrap your existing video, mark where the offer appears, and the retention curve shows the real percentage of viewers reaching it — plus the moment most of them leave, so you know what to fix.</p>
  <p>Start free and see your true reach-to-offer on your own video.</p>`,
  faq: [
    { q: 'What is a good reach-to-offer percentage?', a: 'There is no universal number — it depends on traffic temperature and video length. What matters is measuring your own and raising it over time. Cold ad traffic to a long VSL will reach the offer far less often than warm traffic to a short one.' },
    { q: 'How is this different from completion rate?', a: 'Completion rate is reaching the very end. Reach-to-offer is reaching the moment that asks for the sale, which usually comes before the end and is the part that actually drives revenue.' },
  ],
};
