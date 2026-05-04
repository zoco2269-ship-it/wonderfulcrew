// 페이지 로드 시 로그인 체크 (보호된 페이지만) + 프로필 완료 강제 (전화번호)
// 즉시 Supabase 세션 확인 후 없으면 로그인 페이지로 리다이렉트
(function() {
  var page = location.pathname.split('/').pop() || '';
  var ADMIN_EMAILS_GATE = ['zoco2269@gmail.com','guswn5164@gmail.com'];

  // 공개 페이지면 체크 스킵
  var publicPages = [
    'index.html','index-en.html','','about.html','about-en.html',
    'login.html','login-en.html','plans.html','plans-en.html',
    'pricing.html','pricing-en.html','contact.html','terms.html',
    'privacy.html','copyright.html',
    'deposit-request.html',
    'lecture.html','lecture-en.html',
    'resume-guide.html','resume-guide-en.html',
    'interview-guide.html','interview-guide-en.html',
    'grooming-guide.html','grooming-guide-en.html',
    'culture-difference.html','culture-difference-en.html',
    'customer-service.html','customer-service-en.html',
    'english-interview.html','english-interview-en.html'
  ];
  if (publicPages.indexOf(page) !== -1) return;

  // 프로필 완료 체크 (phone 필수) — 30분마다 서버 강제 재검증
  // 이전 사용자가 wc_profile_done=1 캐시를 가지고 있어도 서버 진실로 다시 점검
  async function ensureProfileComplete(userObj){
    if (page === 'profile-setup.html') return; // 프로필 페이지 자체는 통과
    if (ADMIN_EMAILS_GATE.indexOf(userObj.email) !== -1) return; // 어드민 우회

    // 30분 이내 검증 캐시 통과
    var lastCheck = parseInt(localStorage.getItem('wc_profile_check_at')||'0',10);
    var FRESH_MS = 30*60*1000;
    if (localStorage.getItem('wc_profile_done')==='1' && (Date.now()-lastCheck)<FRESH_MS) return;

    try{
      if (typeof getSupabase !== 'function') return;
      var sb = getSupabase();
      if (!sb) return;
      var res = await sb.from('users').select('phone').eq('auth_id', userObj.id).maybeSingle();
      var hasPhone = !!(res && res.data && res.data.phone && String(res.data.phone).replace(/\D/g,'').length >= 10);
      localStorage.setItem('wc_profile_check_at', String(Date.now()));
      if (hasPhone) {
        localStorage.setItem('wc_profile_done','1');
      } else {
        localStorage.removeItem('wc_profile_done');
        location.replace('profile-setup.html');
      }
    }catch(e){ /* fail-open: 네트워크 에러 시 차단하지 않음 */ }
  }

  // localStorage에 이미 있으면 프로필만 점검 후 통과
  var cached = localStorage.getItem('wc_user');
  if (cached) {
    try { ensureProfileComplete(JSON.parse(cached)); } catch(e) {}
    return;
  }

  // Supabase 세션 즉시 조회 (최대 400ms만 기다림)
  var resolved = false;
  function redirectToLogin(){
    if (resolved) return;
    resolved = true;
    location.replace('login.html?redirect=' + encodeURIComponent(page));
  }
  function checkSupabase(){
    if (localStorage.getItem('wc_user')) { resolved = true; return; }
    if (typeof getSupabase !== 'function' || !getSupabase()) { redirectToLogin(); return; }
    getSupabase().auth.getSession().then(function(result) {
      if (resolved) return;
      if (result && result.data && result.data.session && result.data.session.user) {
        var u = result.data.session.user;
        var userObj = {
          id: u.id, email: u.email,
          name: (u.user_metadata && u.user_metadata.full_name) || '',
          avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
        };
        localStorage.setItem('wc_user', JSON.stringify(userObj));
        resolved = true;
        ensureProfileComplete(userObj);
      } else {
        redirectToLogin();
      }
    }).catch(redirectToLogin);
  }
  // Supabase SDK 로드 대기용 최대 400ms
  var attempts = 0;
  var waitTimer = setInterval(function() {
    attempts++;
    if (typeof getSupabase === 'function' && getSupabase()) {
      clearInterval(waitTimer);
      checkSupabase();
    } else if (attempts >= 4) { // 400ms
      clearInterval(waitTimer);
      redirectToLogin();
    }
  }, 100);
})();
