(function(){
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
})();