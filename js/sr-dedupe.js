// Android Chrome Web Speech API 중복 방출 버그 방어층 v4
// consecutive 반복 제거 + prefix/overlap 병합 + MutationObserver 즉시 반응
(function(){
  if(!window.addEventListener) return;

  function normWord(w){
    return (w||'').toLowerCase().replace(/[^\w가-힣]/g,'');
  }

  // 1) 연속 반복 제거 — "my name is my name is" → "my name is"
  function collapseRepeats(tokens){
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
    return tokens;
  }

  // 2) prefix/overlap 병합 — "my name is my name is john" → "my name is john"
  // 텍스트를 여러 세그먼트로 볼 때, 이전 세그먼트가 다음 세그먼트의 접두어면 제거
  function mergeOverlaps(tokens){
    // 누적된 배열에서 반복적으로 "앞부분이 뒷부분의 시작과 같은" 쌍을 찾아 병합
    // 간단한 휴리스틱: 전체 길이의 40%까지의 길이에서 시작해 overlap 검사
    var len = tokens.length;
    if(len < 4) return tokens;
    // 전체 텍스트를 반으로 나눠, 왼쪽이 오른쪽의 접두어인지 검사
    for(var split = Math.floor(len/2); split >= 2; split--){
      var left = tokens.slice(0, split);
      var rightStart = tokens.slice(split, split*2);
      var allMatch = true;
      for(var i = 0; i < split; i++){
        if(normWord(left[i]) !== normWord(rightStart[i])){
          allMatch = false; break;
        }
      }
      if(allMatch){
        // 왼쪽 split 개 제거 (오른쪽이 확장된 버전이니 오른쪽 유지)
        tokens.splice(0, split);
        return mergeOverlaps(tokens); // 재귀 — 더 줄일 게 있는지
      }
    }
    return tokens;
  }

  function dedupe(text){
    if(!text || text.length < 4) return text;
    var tokens = text.split(/\s+/).filter(function(t){return t.length>0;});
    if(tokens.length < 2) return text;
    tokens = collapseRepeats(tokens);
    tokens = mergeOverlaps(tokens);
    tokens = collapseRepeats(tokens); // 한 번 더 (merge 후 새 반복 생길 수 있음)
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
    setInterval(function(){ scanAll(); installObservers(); }, 100);
    // 디버그 지표 — body 에 속성 추가해서 버전 확인 가능
    if(document.body) document.body.setAttribute('data-sr-dedupe','v4');
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window._srDedupe = dedupe;
  window._srVersion = 4;
})();
