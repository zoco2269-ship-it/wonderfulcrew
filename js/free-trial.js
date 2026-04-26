/**
 * WonderfulCrew 무료체험 시스템
 * - Supabase 기반: 로그인 사용자별 사용 횟수 서버 관리
 * - localStorage는 캐시 용도 (오프라인/빠른 체크)
 */

var FREE_TRIAL_KEY = 'wc_free_trial';
var FREE_TRIAL_MAX = 10;
var _trialSynced = false;

function getTrialData() {
  try { return JSON.parse(localStorage.getItem(FREE_TRIAL_KEY) || '{}'); } catch(e) { return {}; }
}

function saveTrialData(data) {
  localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(data));
}

// 서버(Supabase user_metadata)에 사용 횟수 저장 — 브라우저간 공유
async function saveTrialToServer(used) {
  if (localStorage.getItem('wc_test_mode') === 'true') return;
  try {
    var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (!sb) return;
    await sb.auth.updateUser({ data: { free_trial_used: used } });
  } catch(e) {}
}

// Supabase에서 사용 횟수 동기화 — 서버·로컬 중 큰 값 사용 (절대 감소 불가)
// user_metadata.free_trial_used 를 소스로 사용 → 브라우저 바꿔도 카운트 유지
async function syncTrialFromServer() {
  if (_trialSynced) return;
  if (localStorage.getItem('wc_test_mode') === 'true') return;
  try {
    var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (!sb) return;
    var { data } = await sb.auth.getUser();
    if (!data || !data.user) return;
    var serverUsed = 0;
    if (data.user.user_metadata && typeof data.user.user_metadata.free_trial_used === 'number') {
      serverUsed = data.user.user_metadata.free_trial_used;
    }
    var localData = getTrialData();
    var localUsed = localData.used || 0;
    var merged = Math.max(localUsed, serverUsed);
    localData.used = merged;
    saveTrialData(localData);
    _trialSynced = true;
    // 로컬이 서버보다 크면 서버에 업로드 (다른 브라우저에서 공유되도록)
    if (localUsed > serverUsed) {
      try { await sb.auth.updateUser({ data: { free_trial_used: merged } }); } catch(e) {}
    }
  } catch(e) { /* fallback to localStorage */ }
}

// 페이지 로드 시 동기화 시도
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(syncTrialFromServer, 1500);
});

function getFreeTrialLeft() {
  var data = getTrialData();
  if (data.subscribed) return -1;
  var used = data.used || 0;
  return Math.max(0, FREE_TRIAL_MAX - used);
}

function isSubscribed() {
  var data = getTrialData();
  return data.subscribed === true;
}

function useFreeTrialOrCheck() {
  if (typeof isAdmin === 'function' && isAdmin()) return true;

  var data = getTrialData();
  if (data.subscribed) return true;

  var used = data.used || 0;
  var left = FREE_TRIAL_MAX - used;

  if (left > 0) {
    data.used = used + 1;
    saveTrialData(data);
    saveTrialToServer(data.used);
    var remaining = FREE_TRIAL_MAX - data.used;
    showTrialToast(remaining);
    return true;
  } else {
    showSubscribePopup();
    return false;
  }
}

function showTrialToast(remaining) {
  var existing = document.getElementById('wc-trial-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'wc-trial-toast';
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1A2340;color:#fff;padding:12px 24px;border-radius:28px;font-size:0.84rem;font-family:inherit;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;';
  if (remaining > 0) {
    toast.innerHTML = '<span style="color:#C9A84C;font-weight:700;">무료체험</span> ' + remaining + '회 남음';
  } else {
    toast.innerHTML = '<span style="color:#C9A84C;font-weight:700;">무료체험</span> 모두 사용 완료';
  }
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; }, 2500);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

function showSubscribePopup() {
  var existing = document.getElementById('wc-subscribe-popup');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'wc-subscribe-popup';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:40px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<div style="font-size:2rem;margin-bottom:12px;">✨</div>' +
    '<h2 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:#1A2340;margin-bottom:8px;">무료체험이 끝났습니다</h2>' +
    '<p style="font-size:0.88rem;color:#5A5048;line-height:1.7;margin-bottom:24px;">더 많은 콘텐츠와 AI 코칭을 이용하려면<br>월정액을 구독해주세요.</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<a href="plans.html" style="display:block;padding:14px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;border-radius:28px;font-size:0.92rem;font-weight:700;text-decoration:none;">구독 플랜 보기</a>' +
      '<button onclick="this.closest(\'#wc-subscribe-popup\').remove();" style="padding:10px;background:none;border:1px solid #e8e0d0;border-radius:28px;font-size:0.84rem;color:#5A5048;cursor:pointer;font-family:inherit;">닫기</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function renderTrialBadge(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  // 관리자는 뱃지 자체 숨김 (체험 종료·관리자 표기 둘 다 안 보임)
  if (typeof isAdmin === 'function' && isAdmin()) {
    el.innerHTML = '';
    return;
  }
  if (localStorage.getItem('wc_paid') === 'true' || isSubscribed()) {
    el.innerHTML = '<span style="color:#C9A84C;font-weight:600;font-size:0.82rem;">구독 중 ✓</span>';
    return;
  }
  var left = getFreeTrialLeft();
  if (left <= 0) {
    el.innerHTML = '<span style="font-size:0.82rem;color:#C62828;font-weight:700;">무료체험 종료 · 요금제를 선택해주세요</span>';
  } else {
    el.innerHTML = '<span style="font-size:0.82rem;color:#5A5048;">무료체험 <b style="color:#C9A84C;">' + left + '회</b> 남음</span>';
  }
}

// 연습·유료 페이지 진입 시 게이트
(function(){
  var page = location.pathname.split('/').pop() || '';
  var gatedPages = [
    'interview-practice.html','roleplay-practice-ko.html','roleplay-practice-en.html',
    'roleplay-practice.html','discussion-practice-ko.html','discussion-practice.html',
    'discussion1.html','discussion2.html','video-practice.html','final.html',
    'chatbot.html','chatbot-en.html','word-shooting.html','ai-coach.html','ai-coach-en.html',
    'debate-practice.html','smalltalk.html','walking-analysis.html','coach-feedback.html',
    'live-booking.html','lecture.html'
  ];
  if (gatedPages.indexOf(page) === -1) return;
  // wc_test_mode 는 어드민 전용 시뮬레이션 플래그 — 일반 사용자에게 잘못 박혀있으면 자동 청소
  // (이전에 어드민이 토글하고 비어드민으로 로그인 전환하면 잔재 → 환불 카운트 안 깎이는 버그 방지)
  function _isAdminSync(){
    try {
      var u = JSON.parse(localStorage.getItem('wc_user') || 'null');
      var ADMIN = ['zoco2269@gmail.com','guswn5164@gmail.com'];
      return u && ADMIN.indexOf(u.email) !== -1;
    } catch(e) { return false; }
  }
  if (localStorage.getItem('wc_test_mode') === 'true' && !_isAdminSync()) {
    localStorage.removeItem('wc_test_mode');
  }
  // 테스트 모드는 어드민일 때만 즉시 리다이렉트 (DOM 기다리지 않음)
  if (localStorage.getItem('wc_test_mode') === 'true' && _isAdminSync()) {
    location.replace('plans.html?blocked=' + encodeURIComponent(page));
    return;
  }
  // 즉시 체크 (어드민이나 유료는 통과)
  function gateCheck(){
    // 테스트 모드는 어드민일 때만 잠금 (어드민이 결제 플로우 검증 중)
    if (localStorage.getItem('wc_test_mode') === 'true' && _isAdminSync()) {
      document.body.style.pointerEvents = 'none';
      document.body.style.filter = 'blur(4px)';
      showLockedGate();
      return;
    }
    if (typeof isAdmin === 'function' && isAdmin()) return;
    if (localStorage.getItem('wc_paid') === 'true') return;
    var data = getTrialData();
    if (data.subscribed === true) return;
    var used = data.used || 0;
    if (used < FREE_TRIAL_MAX) {
      data.used = used + 1;
      saveTrialData(data);
      saveTrialToServer(data.used);
      showTrialToast(FREE_TRIAL_MAX - data.used);
      return;
    }
    // 무료체험 소진 + 미결제 → 강제 게이트
    document.body.style.pointerEvents = 'none';
    document.body.style.filter = 'blur(4px)';
    showLockedGate();
  }
  function showLockedGate(){
    if (document.getElementById('wc-locked-gate')) return;
    var g = document.createElement('div');
    g.id = 'wc-locked-gate';
    g.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,30,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:auto;';
    g.innerHTML = '<div style="background:#fff;border-radius:20px;padding:44px 36px;max-width:420px;width:90%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.5);pointer-events:auto;filter:none;">' +
      '<div style="font-size:2.4rem;margin-bottom:14px;">🔒</div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-size:1.5rem;color:#1A2340;margin-bottom:10px;">유료 회원 전용 콘텐츠</h2>' +
      '<p style="font-size:0.9rem;color:#5A5048;line-height:1.75;margin-bottom:26px;">무료체험 10회를 모두 사용하셨습니다.<br>요금제를 결제하시면 바로 이용 가능합니다.</p>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<a href="plans.html" style="display:block;padding:15px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;border-radius:28px;font-size:0.94rem;font-weight:700;text-decoration:none;pointer-events:auto;">요금제 보러가기 →</a>' +
        '<a href="pricing.html" style="display:block;padding:12px;background:#1A2340;color:#fff;border-radius:28px;font-size:0.86rem;font-weight:600;text-decoration:none;pointer-events:auto;">🏆 프리미엄 250만원 패키지</a>' +
        '<a href="index.html" style="display:block;padding:10px;color:#5A5048;font-size:0.82rem;text-decoration:underline;pointer-events:auto;">홈으로 돌아가기</a>' +
      '</div>' +
    '</div>';
    document.body.appendChild(g);
  }
  // 페이지 로드 시 — 서버 동기화 먼저, 그 다음 게이트 체크 1회만 (이중 증가 방지)
  document.addEventListener('DOMContentLoaded', function(){
    var ranOnce=false;
    function runGateOnce(){if(ranOnce) return; ranOnce=true; gateCheck();}
    // Supabase 클라이언트 준비될 때까지 최대 2초 대기, 그 후 sync → gate
    var waited=0;
    var tick=setInterval(function(){
      waited+=200;
      var sbReady = (typeof getSupabase==='function') && getSupabase();
      if(sbReady || waited>=2000){
        clearInterval(tick);
        if(sbReady && typeof syncTrialFromServer==='function'){
          syncTrialFromServer().then(runGateOnce).catch(runGateOnce);
        } else {
          runGateOnce();
        }
      }
    },200);
  });
})();
