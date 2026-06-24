(function(){
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
})();