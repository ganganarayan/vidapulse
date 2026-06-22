(function(){
  var input=document.getElementById('kb-search-input');
  var out=document.getElementById('kb-results');
  if(!input||!out)return;
  var data=[];
  fetch('/kb-assets/search-index.json').then(function(r){return r.json();}).then(function(d){data=d;});
  function render(q){
    out.innerHTML='';
    var s=q.trim().toLowerCase();
    if(!s)return;
    var hits=data.filter(function(e){return e.t.toLowerCase().indexOf(s)>-1||e.c.toLowerCase().indexOf(s)>-1;}).slice(0,12);
    if(!hits.length){out.innerHTML='<div class="kb-noresults">No matches yet — try "retention", "drop-off" or "Wistia".</div>';return;}
    hits.forEach(function(e){
      var a=document.createElement('a');
      a.href=e.u;
      a.innerHTML=e.t.replace(/[&<>]/g,function(ch){return ch==='&'?'&amp;':ch==='<'?'&lt;':'&gt;';})+' <small>'+e.c+'</small>';
      out.appendChild(a);
    });
  }
  input.addEventListener('input',function(){render(input.value);});
})();