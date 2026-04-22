// Android Chrome Web Speech API 중복 방출 버그 방어층 v3
// transcript 화면 텍스트에서 반복 어구를 즉시/주기적으로 제거
(function(){
  if(!window.addEventListener) return;

  function normWord(w){
    return (w||'').toLowerCase().replace(/[^\w가-힣]/g,'');
  }

  function dedupe(text){
    if(!text || text.length < 4) return text;
    var tokens = text.split(/\s+/).filter(function(t){return t.length>0;});
    if(tokens.length < 2) return text;

    var changed = true;
    var passes = 0;
    while(changed && passes < 30){
      changed = false;
      passes++;
      var maxN = Math.min(12, Math.floor(tokens.length/2));
      for(var n = maxN; n >= 1; n--){
        var found = false;
        for(var i = 0; i + 2*n <= tokens.length; i++){
          var match = true;
          for(var j = 0; j < n; j++){
            if(normWord(tokens[i+j]) !== normWord(tokens[i+n+j])){
              match = false; break;
            }
          }
          if(match){
            var anyContent = false;
            for(var k = 0; k < n; k++){
              if(normWord(tokens[i+k])){ anyContent = true; break; }
            }
            if(!anyContent){ match = false; }
          }
          if(match){
            tokens.splice(i+n, n);
            changed = true;
            found = true;
            break;
          }
        }
        if(found) break;
      }
    }
    return tokens.join(' ');
  }

  var SELECTORS = '#transcript,#tr,.transcript-bar,#rec-label,#shadow-result,.shadow-result,#result,.feedback-panel,.chat .text,#q-hint,.cq-hint';
  var _writing = new WeakSet();

  function clean(el){
    if(!el || _writing.has(el)) return;
    var original = el.textContent;
    if(!original || original.length < 4) return;
    if(el._srLast === original) return;
    try {
      var cleaned = dedupe(original);
      if(cleaned !== original && cleaned.length < original.length){
        _writing.add(el);
        el._srLast = cleaned;
        el.textContent = cleaned;
        setTimeout(function(){_writing.delete(el);},10);
      } else {
        el._srLast = original;
      }
    } catch(e) {
      el._srLast = original;
    }
  }

  function scanAll(){
    var els = document.querySelectorAll(SELECTORS);
    for(var i=0; i<els.length; i++) clean(els[i]);
  }

  function installObservers(){
    var els = document.querySelectorAll(SELECTORS);
    for(var i=0; i<els.length; i++){
      var el = els[i];
      if(el._srObserved) continue;
      el._srObserved = true;
      try {
        var mo = new MutationObserver(function(mutations){
          for(var m=0; m<mutations.length; m++){
            clean(mutations[m].target);
          }
        });
        mo.observe(el, {childList:true, characterData:true, subtree:true});
      } catch(e){}
    }
  }

  function start(){
    scanAll();
    installObservers();
    setInterval(function(){ scanAll(); installObservers(); }, 150);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window._srDedupe = dedupe;
  window._srVersion = 3;
})();
