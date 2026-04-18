// 페이지 로드 시 로그인 체크 (보호된 페이지만)
// supabase-client.js의 세션 복원 완료를 기다린 후 체크
(function() {
  // localStorage에 이미 있으면 즉시 통과
  if (localStorage.getItem('wc_user')) return;

  // Supabase 초기화 완료를 기다림 (최대 5초, 200ms 간격)
  var maxWait = 25;
  var count = 0;
  var timer = setInterval(function() {
    count++;

    // 로그인 정보가 생겼으면 통과
    if (localStorage.getItem('wc_user')) {
      clearInterval(timer);
      return;
    }

    // 최대 대기 시간 도달
    if (count >= maxWait) {
      clearInterval(timer);
      // Supabase 직접 확인
      if (typeof getSupabase === 'function' && getSupabase()) {
        getSupabase().auth.getSession().then(function(result) {
          if (result.data && result.data.session && result.data.session.user) {
            var u = result.data.session.user;
            localStorage.setItem('wc_user', JSON.stringify({
              id: u.id, email: u.email,
              name: (u.user_metadata && u.user_metadata.full_name) || '',
              avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
            }));
          } else {
            if (typeof requireAuth === 'function') requireAuth();
          }
        }).catch(function() {});
      }
    }
  }, 200);
})();
