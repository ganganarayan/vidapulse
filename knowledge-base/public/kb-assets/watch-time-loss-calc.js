(function(){
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
})();