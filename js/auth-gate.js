// 페이지 로드 시 로그인 체크
// supabase-client.js 이후에 로드해야 함
document.addEventListener('DOMContentLoaded', function() {
  // Supabase 초기화 대기 후 체크
  setTimeout(function() {
    if (typeof requireAuth === 'function') requireAuth();
  }, 500);
});
