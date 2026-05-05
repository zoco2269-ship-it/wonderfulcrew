// 페이지 로드 시 로그인 체크 + 프로필 완료(전화번호) 강제 (HARD BLOCK)
// 로그인된 사용자가 phone 없으면 페이지 자체를 화이트아웃 → 검증 후만 노출
(function() {
  var page = location.pathname.split('/').pop() || '';
  var ADMIN_EMAILS_GATE = ['zoco2269@gmail.com','guswn5164@gmail.com'];

  // 절대 체크하지 않는 페이지
  var SKIP_PAGES = ['login.html','login-en.html','profile-setup.html','terms.html','privacy.html','copyright.html'];
  if (SKIP_PAGES.indexOf(page) !== -1) return;

  // 공개 페이지 (미로그인 통과, 단 로그인 사용자는 phone 검증)
  var publicPages = [
    'index.html','index-en.html','','about.html','about-en.html',
    'plans.html','plans-en.html','pricing.html','pricing-en.html','contact.html',
    'deposit-request.html',
    'lecture.html','lecture-en.html',
    'resume-guide.html','resume-guide-en.html',
    'interview-guide.html','interview-guide-en.html',
    'grooming-guide.html','grooming-guide-en.html',
    'culture-difference.html','culture-difference-en.html',
    'customer-service.html','customer-service-en.html',
    'english-interview.html','english-interview-en.html',
    'press.html','insights.html'
  ];

  // ★ HARD BLOCK: 검증 진행 중 페이지 화이트아웃
  // 로그인 사용자가 phone 없으면 어떤 페이지에서도 콘텐츠 못 봄
  var cached = localStorage.getItem('wc_user');
  var cacheValid = false;
  try {
    if (cached) {
      var u = JSON.parse(cached);
      // 어드민 우회
      if (ADMIN_EMAILS_GATE.indexOf(u.email) !== -1) cacheValid = true;
      // 30분 이내 검증 캐시 통과
      var lastCheck = parseInt(localStorage.getItem('wc_profile_check_at')||'0',10);
      var FRESH_MS = 30*60*1000;
      if (localStorage.getItem('wc_profile_done')==='1' && (Date.now()-lastCheck)<FRESH_MS) cacheValid = true;
    }
  } catch(e) {}

  // 캐시 유효하면 페이지 그대로 — 어드민 또는 검증된 사용자
  if (cacheValid) return;

  // 캐시 없으면 + 공개 페이지면 그대로 노출 (미로그인 사용자)
  if (!cached && publicPages.indexOf(page) !== -1) {
    // 백그라운드로 phone 검증 (만약 로그인 상태면)
    runBackgroundCheck();
    return;
  }

  // 검증 필요한 상태 → 페이지 즉시 화이트아웃
  injectBlockingStyle();

  function injectBlockingStyle(){
    var s = document.createElement('style');
    s.id = 'wc-auth-block';
    s.textContent = 'html body{visibility:hidden!important;}html body.wc-verified,html body.wc-verifying-show{visibility:visible!important;}#wc-auth-overlay{position:fixed;inset:0;z-index:99999;background:#FAF7F0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;font-family:"Noto Sans KR",sans-serif;visibility:visible!important;}#wc-auth-overlay .ring{width:38px;height:38px;border:3px solid rgba(201,168,76,0.25);border-top-color:#C9A84C;border-radius:50%;animation:wc-spin 0.7s linear infinite;}@keyframes wc-spin{to{transform:rotate(360deg);}}#wc-auth-overlay .msg{font-size:0.86rem;color:#5A5048;letter-spacing:0.04em;}';
    document.head.appendChild(s);

    function showOverlay(){
      if (document.getElementById('wc-auth-overlay')) return;
      var o = document.createElement('div');
      o.id = 'wc-auth-overlay';
      o.innerHTML = '<div class="ring"></div><div class="msg">계정 확인 중…</div>';
      (document.body || document.documentElement).appendChild(o);
    }
    if (document.body) showOverlay();
    else document.addEventListener('DOMContentLoaded', showOverlay);
  }

  function unblock(){
    var s = document.getElementById('wc-auth-block');
    if (s) s.remove();
    var o = document.getElementById('wc-auth-overlay');
    if (o) o.remove();
    if (document.body) document.body.classList.add('wc-verified');
  }

  function waitForSupabase(maxMs){
    return new Promise(function(resolve){
      var elapsed = 0;
      var iv = setInterval(function(){
        if (typeof getSupabase === 'function' && getSupabase()) {
          clearInterval(iv); resolve(getSupabase());
        } else if ((elapsed += 100) >= maxMs) {
          clearInterval(iv); resolve(null);
        }
      }, 100);
    });
  }

  async function runBackgroundCheck(){
    var sb = await waitForSupabase(2000);
    if (!sb) return;
    try{
      var sess = await sb.auth.getSession();
      if (!sess || !sess.data || !sess.data.session || !sess.data.session.user) return;
      var user = sess.data.session.user;
      if (ADMIN_EMAILS_GATE.indexOf(user.email) !== -1) return;
      var res = await sb.from('users').select('phone').eq('auth_id', user.id).maybeSingle();
      var hasPhone = !!(res && res.data && res.data.phone && String(res.data.phone).replace(/\D/g,'').length >= 10);
      if (!hasPhone) location.replace('profile-setup.html');
      else { localStorage.setItem('wc_profile_done','1'); localStorage.setItem('wc_profile_check_at', String(Date.now())); }
    }catch(e){}
  }

  async function blockingCheck(){
    var sb = await waitForSupabase(3000);
    if (!sb) {
      // SDK 로드 실패 → 미로그인으로 간주
      if (publicPages.indexOf(page) !== -1) { unblock(); return; }
      location.replace('login.html?redirect='+encodeURIComponent(page));
      return;
    }
    try{
      var sess = await sb.auth.getSession();
      var hasSession = sess && sess.data && sess.data.session && sess.data.session.user;
      if (!hasSession) {
        if (publicPages.indexOf(page) !== -1) { unblock(); return; }
        location.replace('login.html?redirect='+encodeURIComponent(page));
        return;
      }
      var user = sess.data.session.user;
      // wc_user 캐시 갱신
      localStorage.setItem('wc_user', JSON.stringify({
        id:user.id, email:user.email,
        name:(user.user_metadata&&user.user_metadata.full_name)||'',
        avatar:(user.user_metadata&&user.user_metadata.avatar_url)||''
      }));
      // 어드민 우회
      if (ADMIN_EMAILS_GATE.indexOf(user.email) !== -1) { unblock(); return; }
      // phone 검증
      var res = await sb.from('users').select('phone').eq('auth_id', user.id).maybeSingle();
      var hasPhone = !!(res && res.data && res.data.phone && String(res.data.phone).replace(/\D/g,'').length >= 10);
      if (hasPhone) {
        localStorage.setItem('wc_profile_done','1');
        localStorage.setItem('wc_profile_check_at', String(Date.now()));
        unblock();
      } else {
        localStorage.removeItem('wc_profile_done');
        location.replace('profile-setup.html');
      }
    }catch(e){
      // 네트워크 에러 — 화이트아웃 풀어서 서비스 다운 방지 (단 캐시 무효 상태)
      unblock();
    }
  }
  blockingCheck();
})();
