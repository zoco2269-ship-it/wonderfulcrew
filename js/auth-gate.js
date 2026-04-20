// 페이지 로드 시 로그인 체크 (보호된 페이지만)
// 즉시 Supabase 세션 확인 후 없으면 로그인 페이지로 리다이렉트
(function() {
  // localStorage에 이미 있으면 즉시 통과
  if (localStorage.getItem('wc_user')) return;

  // 공개 페이지면 체크 스킵
  var page = location.pathname.split('/').pop() || '';
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
        localStorage.setItem('wc_user', JSON.stringify({
          id: u.id, email: u.email,
          name: (u.user_metadata && u.user_metadata.full_name) || '',
          avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
        }));
        resolved = true;
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
