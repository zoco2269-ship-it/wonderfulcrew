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
  // 단조성 보장 — used 값이 기존보다 작은 write 는 차단 (카운트 회복 방지)
  try {
    var prev = JSON.parse(localStorage.getItem(FREE_TRIAL_KEY) || '{}');
    if (typeof prev.used === 'number' && typeof data.used === 'number' && data.used < prev.used) {
      data.used = prev.used;
    }
  } catch(e) {}
  localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(data));
}

// 서버 users 테이블에 사용 횟수 저장 — 브라우저간 공유
async function saveTrialToServer(used) {
  if (localStorage.getItem('wc_test_mode') === 'true') return;
  try {
    var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (!sb) return;
    var { data: udata } = await sb.auth.getUser();
    if (!udata || !udata.user) return;
    await sb.from('users').update({ free_trial_used: used }).eq('auth_id', udata.user.id);
  } catch(e) {}
}

// Supabase users 테이블에서 plan_active + free_trial_used 동기화 (단일 진실원)
// gateCheck 직전 호출되어 wc_paid 잔재 청소 + 카운트 머지까지 한 번에 처리
async function syncTrialFromServer() {
  if (_trialSynced) return;
  if (localStorage.getItem('wc_test_mode') === 'true') return;
  try {
    var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (!sb) return;
    var { data: udata } = await sb.auth.getUser();
    if (!udata || !udata.user) return;
    var res = await sb.from('users')
      .select('plan_active, free_trial_used')
      .eq('auth_id', udata.user.id)
      .maybeSingle();
    var planActive = !!(res && res.data && res.data.plan_active === true);
    var serverUsed = (res && res.data && typeof res.data.free_trial_used === 'number') ? res.data.free_trial_used : 0;
    // ★ race condition 보호: server plan_active=false 라도 payments 테이블에 결제 기록 있으면 heal-plan-active 가 자동 복구
    // 결제 직후 save-payment 처리 중에 sync 가 먼저 fire 되어도 wc_paid 가 부당하게 제거되지 않도록.
    if (!planActive) {
      try {
        var hr = await fetch('/api/heal-plan-active', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({userId: udata.user.id, email: udata.user.email || ''})
        });
        var hd = await hr.json();
        if (hd && hd.planActive === true) planActive = true;
      } catch(e) {}
    }
    // wc_paid 강제 동기화 — 어드민/이전 결제 시뮬 잔재 자동 청소
    if (planActive) localStorage.setItem('wc_paid', 'true');
    else localStorage.removeItem('wc_paid');
    // 카운트 머지 (절대 감소 X) + subscribed 도 plan_active 진실원
    var localData = getTrialData();
    var localUsed = localData.used || 0;
    var merged = Math.max(localUsed, serverUsed);
    localData.used = merged;
    localData.subscribed = planActive;
    saveTrialData(localData);
    _trialSynced = true;
    // 로컬이 서버보다 크면 서버에 업로드
    if (localUsed > serverUsed) {
      try { await sb.from('users').update({ free_trial_used: merged }).eq('auth_id', udata.user.id); } catch(e) {}
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
  if (localStorage.getItem('wc_paid') === 'true') return true;

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
  // Vercel 등에서 .html 없이 라우팅되어도 매칭되도록 확장자 제거 후 비교
  var rawPage = location.pathname.split('/').pop() || '';
  var page = rawPage.replace(/\.html$/i, '');
  var gatedPages = [
    'interview-practice','roleplay-practice-ko','roleplay-practice-en',
    'roleplay-practice','discussion-practice-ko','discussion-practice',
    'discussion1','discussion2','video-practice','final',
    'chatbot','chatbot-en','word-shooting','ai-coach','ai-coach-en',
    'debate-practice','smalltalk','walking-analysis','coach-feedback',
    'live-booking','lecture','lecture-en'
  ];
  if (gatedPages.indexOf(page) === -1) return;
  // 페이지별 화이트리스트 — 특정 학생에게 특정 페이지만 무상 액세스 허용
  // (결제·구독 무관하게 통과. 다른 페이지·다른 사용자에게 영향 없음)
  var PAGE_WHITELIST = {
    'lecture':    ['eunchae850@gmail.com'],
    'lecture-en': ['eunchae850@gmail.com']
  };
  try {
    var _wlEmails = PAGE_WHITELIST[page];
    if (_wlEmails) {
      var _wlUser = JSON.parse(localStorage.getItem('wc_user') || 'null');
      var _wlEmail = (_wlUser && _wlUser.email) ? String(_wlUser.email).toLowerCase() : '';
      if (_wlEmail && _wlEmails.indexOf(_wlEmail) !== -1) return;
    }
  } catch(e) {}
  // 연락처(phone) 미입력 사용자는 profile-setup 으로 강제 redirect — 무료체험 카운트도 안 깎이게
  // (어드민·결제 사용자는 phone 검증 면제)
  (function _enforcePhone(){
    try {
      var u = JSON.parse(localStorage.getItem('wc_user') || 'null');
      if (!u || !u.id) return; // 비로그인 사용자는 별도 흐름
      var ADMIN = ['zoco2269@gmail.com','guswn5164@gmail.com'];
      if (ADMIN.indexOf(u.email) !== -1) return; // 어드민 면제
      if (localStorage.getItem('wc_paid') === 'true') return; // 결제 사용자 면제
      if (localStorage.getItem('wc_profile_done') === '1') return; // 프로필 완료 캐시 통과
      // server 검증 — phone 있으면 통과, 없으면 redirect
      (async function(){
        try {
          var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
          for (var i=0; i<30 && !sb; i++) {
            await new Promise(function(r){setTimeout(r,100);});
            sb = (typeof getSupabase === 'function') ? getSupabase() : null;
          }
          if (!sb) return;
          var res = await sb.from('users').select('phone, name').eq('auth_id', u.id).maybeSingle();
          var hasPhone = !!(res && res.data && res.data.phone);
          var hasName = !!(res && res.data && res.data.name);
          if (hasPhone && hasName) {
            localStorage.setItem('wc_profile_done', '1');
          } else {
            // phone/name 미입력 → profile-setup 으로 redirect (모든 항목 채워야만 통과)
            location.replace('profile-setup.html?from=' + encodeURIComponent(page));
          }
        } catch(e) {}
      })();
    } catch(e) {}
  })();
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
  // 즉시 동기 +1 (race condition 방지) + server 검증은 비동기 별도
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

    // ★ 즉시 동기 +1 — 페이지 진입한 시점에 무조건 카운트 차감 (server 응답 대기 X)
    var used = data.used || 0;
    if (used < FREE_TRIAL_MAX) {
      data.used = used + 1;
      saveTrialData(data);
      showTrialToast(FREE_TRIAL_MAX - data.used);
      // server 저장은 fire-and-forget (실패해도 다음 sync 때 머지됨)
      saveTrialToServer(data.used);
      // server 진실 검증은 비동기로 별도 — 잔재 청소 + plan_active 결제 사용자면 통과 처리
      _verifyAndCleanupAsync();
      return;
    }
    // 무료체험 소진 + 미결제 → 강제 게이트
    document.body.style.pointerEvents = 'none';
    document.body.style.filter = 'blur(4px)';
    showLockedGate();
  }

  // server users.plan_active 비동기 검증 — gateCheck 와 분리되어 race condition 영향 X
  async function _verifyAndCleanupAsync(){
    try {
      var sb = (typeof getSupabase === 'function') ? getSupabase() : null;
      if (!sb) return;
      var { data: udata } = await sb.auth.getUser();
      if (!udata || !udata.user) return;
      var res = await sb.from('users').select('plan_active, free_trial_used').eq('auth_id', udata.user.id).maybeSingle();
      var planActive = !!(res && res.data && res.data.plan_active === true);
      var serverUsed = (res && res.data && typeof res.data.free_trial_used === 'number') ? res.data.free_trial_used : 0;
      // 결제 사용자면 wc_paid 셋 + subscribed 동기화 (다음 페이지부터 통과)
      if (planActive) {
        localStorage.setItem('wc_paid', 'true');
        var d = getTrialData(); d.subscribed = true; saveTrialData(d);
      } else {
        localStorage.removeItem('wc_paid');
      }
      // server used 가 더 크면 머지 (다른 디바이스 동기화)
      var current = getTrialData();
      if (serverUsed > (current.used || 0)) {
        current.used = serverUsed;
        saveTrialData(current);
      }
    } catch(e) {}
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
        '<a href="index.html" style="display:block;padding:10px;color:#5A5048;font-size:0.82rem;text-decoration:underline;pointer-events:auto;">홈으로 돌아가기</a>' +
      '</div>' +
    '</div>';
    document.body.appendChild(g);
  }
  // ★ 페이지 스크립트 로드 즉시 카운트 차감 — DOM 대기 X
  // 사용자가 페이지 진입 직후 답변 시작/페이지 이동해도 +1 보장
  var _ranOnce = false;
  function _doCountNow(){
    if (_ranOnce) return; _ranOnce = true;
    // 어드민·결제·구독 사용자는 통과 (localStorage 만 의존, 즉시 동기 판정)
    if (typeof isAdmin === 'function' && isAdmin()) return;
    if (localStorage.getItem('wc_paid') === 'true') return;
    var data = getTrialData();
    if (data.subscribed === true) return;
    var used = data.used || 0;
    if (used < FREE_TRIAL_MAX) {
      // 즉시 카운트 +1 + server 저장 (fire-and-forget)
      data.used = used + 1;
      saveTrialData(data);
      saveTrialToServer(data.used);
      // 토스트는 DOM 준비된 후 표시
      var _showToast = function(){ try{ showTrialToast(FREE_TRIAL_MAX - data.used); }catch(e){} };
      if (document.body) _showToast();
      else document.addEventListener('DOMContentLoaded', _showToast);
    } else {
      // 카운트 소진 — server 결제 기록 검증 후 결정 (결제 사용자 보호)
      (async function(){
        try {
          var u = JSON.parse(localStorage.getItem('wc_user') || 'null');
          if (u && u.id) {
            var hr = await fetch('/api/heal-plan-active', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({userId: u.id, email: u.email || ''})
            });
            var hd = await hr.json();
            if (hd && hd.planActive === true) {
              localStorage.setItem('wc_paid', 'true');
              var d = getTrialData(); d.subscribed = true; saveTrialData(d);
              return; // 결제 사용자 — 게이트 표시 X 통과
            }
          }
        } catch(e) {}
        // 결제 기록 없음 → 게이트 표시
        var _showGate = function(){ try{ document.body.style.pointerEvents='none'; showLockedGate(); }catch(e){} };
        if (document.body) _showGate();
        else document.addEventListener('DOMContentLoaded', _showGate);
      })();
    }
  }
  // 즉시 실행 — 페이지 진입 순간 카운트 차감
  _doCountNow();
  // server sync 는 별도 백그라운드 (잔재 청소·plan_active 검증)
  setTimeout(function(){
    if(typeof syncTrialFromServer==='function'){
      try{ syncTrialFromServer().catch(function(){}); }catch(e){}
    }
  },300);
})();
