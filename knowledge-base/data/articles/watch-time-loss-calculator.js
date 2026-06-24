'use strict';

module.exports = {
  metaTitle: 'Watch-Time Loss Calculator for Marketing Videos | VidaPulse',
  metaDescription:
    'Free watch-time loss calculator: see the average percentage of your video that gets watched, the hours of attention you lose each month, and the upside of better retention.',
  answer:
    'The watch-time loss calculator turns average watch time into the attention you are losing. Enter your monthly plays, your video length, and the average watch time, and it returns the average percentage watched, the hours of attention lost each month, and how much more you would capture by lifting average watch time. Watch time is a blunt metric on its own, but it makes the scale of lost attention concrete.',
  tool: {
    name: 'Watch-time loss calculator',
    script: 'watch-time-loss-calc.js',
    html: `      <div class="kb-calc" id="wtc">
        <div class="kb-calc-row"><label for="wtc-plays">Monthly viewers (plays)</label><input class="kb-calc-num" id="wtc-plays" type="number" value="2000" min="0" step="100" /></div>
        <div class="kb-calc-row"><label for="wtc-len">Video length (minutes)</label><input class="kb-calc-num" id="wtc-len" type="number" value="20" min="1" step="1" /></div>
        <div class="kb-calc-row"><label for="wtc-avg">Average watch time (minutes)</label><input class="kb-calc-num" id="wtc-avg" type="number" value="6" min="0" step="1" /></div>
        <div class="kb-calc-row"><label for="wtc-tgt">Target average watch time (minutes)</label><input class="kb-calc-num" id="wtc-tgt" type="number" value="10" min="0" step="1" /></div>
        <div class="kb-calc-results">
          <div class="kb-calc-card"><div class="kb-calc-label">Average watched now</div><div class="kb-calc-figure" id="wtc-pct">30%</div></div>
          <div class="kb-calc-card kb-calc-hl"><div class="kb-calc-label">Attention lost per month</div><div class="kb-calc-figure" id="wtc-lost">467 hrs</div></div>
          <div class="kb-calc-card"><div class="kb-calc-label">Extra attention at target</div><div class="kb-calc-figure" id="wtc-extra">+133 hrs/mo</div></div>
        </div>
        <div class="kb-calc-note">Runs in your browser — nothing is stored.</div>
      </div>`,
    scriptSource: `(function(){
  var g=function(i){return document.getElementById(i);};
  if(!g('wtc-plays'))return;
  var nf=new Intl.NumberFormat('en-US');
  function calc(){
    var plays=Math.max(0,+g('wtc-plays').value||0);
    var len=Math.max(0,+g('wtc-len').value||0);
    var avg=Math.max(0,+g('wtc-avg').value||0);
    var tgt=Math.max(0,+g('wtc-tgt').value||0);
    var pct=len>0?Math.min(100,avg/len*100):0;
    var lostHrs=plays*Math.max(0,len-avg)/60;
    var extraHrs=plays*Math.max(0,tgt-avg)/60;
    g('wtc-pct').textContent=Math.round(pct)+'%';
    g('wtc-lost').textContent=nf.format(Math.round(lostHrs))+' hrs';
    g('wtc-extra').textContent='+'+nf.format(Math.round(extraHrs))+' hrs/mo';
  }
  ['wtc-plays','wtc-len','wtc-avg','wtc-tgt'].forEach(function(id){var e=g(id);if(e){e.addEventListener('input',calc);e.addEventListener('change',calc);}});
  calc();
})();`,
  },
  sections: [
    {
      h2: 'How the calculation works',
      html: `<p>Average watch time as a share of length tells you how much of the video the typical viewer actually sees. Multiply the unwatched minutes by your monthly plays and you get the total attention you paid to acquire but never delivered.</p>
      <ul class="kb-list"><li><strong>Average watched</strong> = average watch time divided by video length</li><li><strong>Attention lost</strong> = plays x (length minus average watch time), in hours</li><li><strong>Extra attention at target</strong> = plays x (target watch time minus current), in hours</li></ul>`,
    },
    {
      h2: 'A worked example',
      html: `<p class="kb-example">Example (illustrative): 2,000 plays of a 20-minute video with a 6-minute average watch time means the typical viewer sees 30% of it, and you lose roughly 467 hours of attention a month. Lift the average to 10 minutes and you capture about 133 more hours of attention every month — much of it from fixing the earliest, steepest drop.</p>`,
    },
    {
      h2: 'Why average watch time can mislead',
      html: `<p>An average hides where people leave. Two videos can share the same average watch time while one loses everyone early and the other holds attention then drops at the end — and those need opposite fixes. Use this number to size the loss, then read the retention curve to find where it actually happens.</p>`,
    },
  ],
  solve: `<p>Average watch time tells you how much attention you are losing; VidaPulse tells you where. Wrap your existing video and the retention curve and second-by-second heatmap show the exact moments viewers leave, so you can cut or rewrite the parts that bleed attention and re-measure the average as it climbs.</p>
  <p>Start free and turn a flat average into a map of where your video loses people.</p>`,
  faq: [
    { q: 'Is a higher average watch time always better?', a: 'Usually, but what matters most is whether viewers reach the part that converts. A shorter, tighter video that gets more people to the offer can beat a longer one with a higher raw average.' },
    { q: 'Where does most watch time get lost?', a: 'Most often in the first few seconds and in a slow middle stretch. A retention curve shows you the exact spots so you fix the biggest losses first.' },
  ],
};
