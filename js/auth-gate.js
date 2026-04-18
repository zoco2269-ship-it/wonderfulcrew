// 페이지 로드 시 로그인 체크
// supabase-client.js 이후에 로드해야 함
document.addEventListener('DOMContentLoaded', function() {
  // 이미 로그인 정보가 있으면 바로 통과
  if (localStorage.getItem('wc_user')) return;

  // Supabase 세션 복원을 기다림
  var checkAuth = function() {
    // Supabase가 세션을 복원하면 wc_user가 세팅됨
    if (localStorage.getItem('wc_user')) return;

    // Supabase가 아직 준비 안 됐으면 더 기다림
    if (typeof _supabaseReady !== 'undefined' && !_supabaseReady) {
      setTimeout(checkAuth, 300);
      return;
    }

    // Supabase 준비됐는데도 wc_user 없으면 → Supabase 세션 직접 확인
    if (typeof getSupabase === 'function' && getSupabase()) {
      getSupabase().auth.getSession().then(function(result) {
        if (result.data && result.data.session) {
          // 세션 있음 → wc_user 저장하고 통과
          var u = result.data.session.user;
          localStorage.setItem('wc_user', JSON.stringify({
            id: u.id, email: u.email,
            name: (u.user_metadata && u.user_metadata.full_name) || '',
            avatar: (u.user_metadata && u.user_metadata.avatar_url) || ''
          }));
        } else {
          // 세션도 없음 → 로그인 필요
          if (typeof requireAuth === 'function') requireAuth();
        }
      }).catch(function() {
        if (typeof requireAuth === 'function') requireAuth();
      });
    } else {
      // Supabase 연결 안 됨 → 로컬 환경이거나 오프라인 → 통과
      return;
    }
  };

  // 1초 후 체크 시작 (Supabase init 시간 확보)
  setTimeout(checkAuth, 1000);
});
