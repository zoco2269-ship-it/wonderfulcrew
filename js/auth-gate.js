// 페이지 로드 시 로그인 체크 + 프로필 완료(전화번호) 강제
// 로그인 사용자는 공개 페이지에서도 phone 검증 → 없으면 profile-setup 강제
(function() {
  var page = location.pathname.split('/').pop() || '';
  var ADMIN_EMAILS_GATE = ['zoco2269@gmail.com','guswn5164@gmail.com'];

  // 절대 체크하지 않는 페이지 (login·profile-setup 등 — 무한 리다이렉트 방지)
  var SKIP_PAGES = ['login.html','login-en.html','profile-setup.html','terms.html','privacy.html','copyright.html'];
  if (SKIP_PAGES.indexOf(page) !== -1) return;

  // 공개 페이지 — 미로그인 사용자도 통과 (단 로그인 사용자는 phone 검증)
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

  // Supabase SDK 로드 대기 (최대 2초)
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

  // 프로필 완료 체크 — 30분 만료 캐시 + 서버 진실 강제
  async function ensureProfileComplete(userObj){
    if (page === 'profile-setup.html') return;
    if (ADMIN_EMAILS_GATE.indexOf(userObj.email) !== -1) return;

    var lastCheck = parseInt(localStorage.getItem('wc_profile_check_at')||'0',10);
    var FRESH_MS = 30*60*1000;
    if (localStorage.getItem('wc_profile_done')==='1' && (Date.now()-lastCheck)<FRESH_MS) return;

    var sb = await waitForSupabase(2000);
    if (!sb) return; // SDK 미로드면 fail-open (서비스 다운 방지)
    try{
      var res = await sb.from('users').select('phone').eq('auth_id', userObj.id).maybeSingle();
      var hasPhone = !!(res && res.data && res.data.phone && String(res.data.phone).replace(/\D/g,'').length >= 10);
      localStorage.setItem('wc_profile_check_at', String(Date.now()));
      if (hasPhone) {
        localStorage.setItem('wc_profile_done','1');
      } else {
        localStorage.removeItem('wc_profile_done');
        location.replace('profile-setup.html');
      }
    }catch(e){ /* fail-open */ }
  }

  function redirectToLogin(){ location.replace('login.html?redirect='+encodeURIComponent(page)); }

  // 1) 캐시된 사용자 있음 → phone 검증 (공개·보호 모두)
  var cached = localStorage.getItem('wc_user');
  if (cached) {
    try { ensureProfileComplete(JSON.parse(cached)); } catch(e) {}
    return;
  }

  // 2) 캐시 없음 + 공개 페이지 → 미로그인 통과
  if (publicPages.indexOf(page) !== -1) {
    // 백그라운드에서 supabase 세션 확인 — 로그인 상태면 phone 검증
    waitForSupabase(2000).then(function(sb){
      if (!sb) return;
      sb.auth.getSession().then(function(result){
        if (result && result.data && result.data.session && result.data.session.user) {
          var u = result.data.session.user;
          var userObj = {
            id: u.id, email: u.email,
            name: (u.user_metadata && u.user_metadata.full_name) || '',
            avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
          };
          localStorage.setItem('wc_user', JSON.stringify(userObj));
          ensureProfileComplete(userObj);
        }
      }).catch(function(){});
    });
    return;
  }

  // 3) 캐시 없음 + 보호 페이지 → 로그인 강제
  waitForSupabase(2000).then(function(sb){
    if (!sb) { redirectToLogin(); return; }
    sb.auth.getSession().then(function(result){
      if (result && result.data && result.data.session && result.data.session.user) {
        var u = result.data.session.user;
        var userObj = {
          id: u.id, email: u.email,
          name: (u.user_metadata && u.user_metadata.full_name) || '',
          avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
        };
        localStorage.setItem('wc_user', JSON.stringify(userObj));
        ensureProfileComplete(userObj);
      } else {
        redirectToLogin();
      }
    }).catch(redirectToLogin);
  });
})();
