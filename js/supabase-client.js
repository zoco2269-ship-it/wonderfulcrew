// WonderfulCrew Supabase Client v4
// Vercel 환경변수에서 자동으로 설정 로드

let _supabase = null;
let _currentUser = null;
let _supabaseReady = false;

var ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

// 서버에서 Supabase 설정 로드
(async function initSupabase(){
  try {
    var res = await fetch('/api/supabase-config');
    var cfg = await res.json();
    if (cfg.url && cfg.anonKey && typeof window.supabase !== 'undefined') {
      _supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      _supabaseReady = true;

      // 다른 계정으로 전환 시 이전 사용자의 localStorage 상태 청소
      // (무료체험 카운트·프로필 입력 플래그·레벨테스트 결과 등이 새 계정에 새도록)
      function _wcClearStaleStateIfUserChanged(newUserId) {
        try {
          var prev = JSON.parse(localStorage.getItem('wc_user') || 'null');
          if (prev && prev.id && prev.id !== newUserId) {
            localStorage.removeItem('wc_free_trial');
            localStorage.removeItem('wc_profile_done');
            localStorage.removeItem('wc_profile');
            localStorage.removeItem('wc_level_result');
            localStorage.removeItem('wc_paid');
            localStorage.removeItem('wc_anon_id');
          }
        } catch(e) {}
      }

      // 세션 변경 감지
      _supabase.auth.onAuthStateChange(function(event, session) {
        if (session && session.user) {
          _wcClearStaleStateIfUserChanged(session.user.id);
          _currentUser = session.user;
          localStorage.setItem('wc_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || '',
            avatar: session.user.user_metadata?.avatar_url || ''
          }));
          if (typeof updateNavLoginBtn === 'function') updateNavLoginBtn();
        } else if (event === 'SIGNED_OUT') {
          _currentUser = null;
          localStorage.removeItem('wc_user');
          // 로그아웃 시에도 사용자별 상태 청소 (다음 사용자 영향 차단)
          localStorage.removeItem('wc_free_trial');
          localStorage.removeItem('wc_profile_done');
          localStorage.removeItem('wc_profile');
          localStorage.removeItem('wc_level_result');
          localStorage.removeItem('wc_paid');
        }
      });

      // 초기 세션 체크
      var { data } = await _supabase.auth.getSession();
      if (data && data.session && data.session.user) {
        _wcClearStaleStateIfUserChanged(data.session.user.id);
        _currentUser = data.session.user;
        localStorage.setItem('wc_user', JSON.stringify({
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.user_metadata?.full_name || '',
          avatar: data.session.user.user_metadata?.avatar_url || ''
        }));
        if (typeof updateNavLoginBtn === 'function') updateNavLoginBtn();
      }
      console.log('Supabase connected:', cfg.url);
    }
  } catch(e) {
    console.log('Supabase config not available, using localStorage fallback');
    _supabaseReady = true;
  }
})();

function getSupabase() {
  return _supabase;
}

// ===== AUTH =====
async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  var sb = getSupabase();
  if (!sb) {
    var local = localStorage.getItem('wc_user');
    return local ? JSON.parse(local) : null;
  }
  try {
    var { data } = await sb.auth.getUser();
    if (data && data.user) {
      _currentUser = data.user;
      localStorage.setItem('wc_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || '',
        avatar: data.user.user_metadata?.avatar_url || ''
      }));
      return data.user;
    }
  } catch(e) {}
  return null;
}

async function signInWithGoogle() {
  var sb = getSupabase();
  if (!sb) { alert('서버 연결 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  var { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/login.html',
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) alert('로그인 실패: ' + error.message);
}

async function signOut() {
  var sb = getSupabase();
  if (sb) await sb.auth.signOut();
  _currentUser = null;
  localStorage.removeItem('wc_user');
  location.href = 'index.html';
}

function getUserId() {
  var user = JSON.parse(localStorage.getItem('wc_user') || '{}');
  return user.id || 'anonymous_' + (localStorage.getItem('wc_anon_id') || (function(){var id=Math.random().toString(36).substring(2,10);localStorage.setItem('wc_anon_id',id);return id;})());
}

function isLoggedIn() {
  return !!localStorage.getItem('wc_user');
}

function isAdmin() {
  // 테스트 모드 — 관리자가 결제 플로우 테스트할 때 어드민 권한 일시 해제
  if (localStorage.getItem('wc_test_mode') === 'true') return false;
  var user = JSON.parse(localStorage.getItem('wc_user') || '{}');
  return ADMIN_EMAILS.indexOf(user.email) !== -1;
}

function requireLogin(msg) {
  if (!isLoggedIn()) {
    alert(msg || '로그인이 필요합니다.');
    location.href = 'login.html';
    return false;
  }
  return true;
}

function requireAuth() {
  if (isLoggedIn()) return;
  var page = location.pathname.split('/').pop() || '';
  // 로그인 없이 볼 수 있는 공개 페이지
  var publicPages = [
    'index.html','index-en.html','','about.html','about-en.html',
    'login.html','login-en.html','plans.html','plans-en.html',
    'pricing.html','pricing-en.html','contact.html','terms.html',
    'privacy.html','copyright.html',
    'deposit-request.html'
  ];
  if (publicPages.indexOf(page) !== -1) return;
  // 나머지는 전부 로그인 필요
  location.href = 'login.html';
}

// ===== DATABASE =====
async function saveToTable(table, record) {
  var sb = getSupabase();
  if (!sb) { console.log('Supabase not connected'); return null; }
  try {
    var { data, error } = await sb.from(table).insert(record).select();
    if (error) { console.error('DB error:', error.message); return null; }
    return data;
  } catch(e) { console.error('DB exception:', e); return null; }
}

// 결제 기록 저장
async function savePayment(payment) {
  return await saveToTable('payments', {
    user_id: getUserId(),
    plan: payment.plan || '',
    amount: payment.amount || 0,
    method: payment.method || 'innopay',
    tid: payment.tid || '',
    moid: payment.moid || '',
    status: payment.status || 'completed',
  });
}

// 구독 상태 저장/업데이트
async function saveSubscription(sub) {
  var sb = getSupabase();
  if (!sb) return null;
  try {
    // upsert: user_id 기준
    var { data, error } = await sb.from('subscriptions').upsert({
      user_id: getUserId(),
      plan: sub.plan || 'free',
      status: sub.status || 'active',
      started_at: sub.started_at || new Date().toISOString(),
      expires_at: sub.expires_at || null,
    }, { onConflict: 'user_id' }).select();
    if (error) console.error('Subscription error:', error.message);
    return data;
  } catch(e) { return null; }
}

// 연습 기록 저장
async function savePracticeRecord(record) {
  return await saveToTable('practice_records', {
    user_id: getUserId(),
    airline: record.airline || '',
    stage: record.stage || '',
    question: record.question || '',
    answer_text: record.answer || '',
    score: record.score || null,
    feedback: record.feedback || '',
  });
}

// 영상 기록 저장
async function saveVideoRecord(record) {
  return await saveToTable('video_records', {
    user_id: getUserId(),
    type: record.type || '',
    airline: record.airline || '',
    storage_path: record.path || '',
    duration_sec: record.duration || 0,
  });
}

// AI 피드백 저장
async function saveFeedback(feedback) {
  return await saveToTable('ai_feedback', {
    user_id: getUserId(),
    page: feedback.page || '',
    question: feedback.question || '',
    student_answer: feedback.studentAnswer || '',
    ai_feedback: feedback.aiFeedback || '',
  });
}

// 레벨 테스트 결과 저장
async function saveLevelResult(result) {
  return await saveToTable('level_results', {
    user_id: getUserId(),
    score: result.score || 0,
    level: result.level || '',
    recommended_airlines: result.airlines || [],
  });
}

// ===== STORAGE =====
async function uploadToStorage(blob, path, contentType) {
  var sb = getSupabase();
  if (!sb) return null;
  var userId = getUserId();
  var fullPath = 'users/' + userId + '/' + path;
  try {
    var { data, error } = await sb.storage.from('wonderfulcrew').upload(fullPath, blob, {
      contentType: contentType || 'video/webm',
      upsert: true
    });
    if (error) { console.error('Upload error:', error); return null; }
    return fullPath;
  } catch(e) { return null; }
}

async function saveLevelTestVideo(blob) {
  return await uploadToStorage(blob, 'level_test/level_test_' + new Date().toISOString().slice(0,10) + '.webm');
}

async function saveRoleplayFirstVideo(blob, airline) {
  var key = 'wc_roleplay_saved_' + (airline || 'general');
  if (localStorage.getItem(key)) return null;
  var path = await uploadToStorage(blob, 'roleplay_first/' + (airline || 'general') + '/first.webm');
  if (path) {
    localStorage.setItem(key, path);
    await saveVideoRecord({type:'roleplay_first', airline:airline, path:path});
  }
  return path;
}

function getPublicUrl(path) {
  var sb = getSupabase();
  if (!sb) return '#';
  var { data } = sb.storage.from('wonderfulcrew').getPublicUrl(path);
  return data?.publicUrl || '#';
}

// 로그인 상태에 따라 nav 버튼 변경 (양방향: 로그인 → MY, 로그아웃 → 로그인)
// EN 과 동일한 outline 스타일 강제 적용 — HTML 개별 수정 없이 한 곳에서 통제
function updateNavLoginBtn() {
  var user = JSON.parse(localStorage.getItem('wc_user') || 'null');
  var loggedIn = !!user;
  var isEn = /-en\.html$/.test(location.pathname) || location.pathname.indexOf('index-en') !== -1;
  var OUTLINE_STYLE = 'display:inline-flex;align-items:center;padding:6px 12px;border-radius:16px;background:rgba(26,35,64,0.06);border:1px solid rgba(201,168,76,0.3);color:var(--gold);font-family:inherit;font-size:0.72rem;font-weight:600;text-decoration:none;';
  // nav 내부의 로그인/MY 버튼만 타깃 (본문 inline 링크 제외)
  var btns = document.querySelectorAll('nav a[href="login.html"], nav a[href="login-en.html"], nav a[href="my-progress.html"], nav a[href="my-progress-en.html"]');
  btns.forEach(function(btn) {
    var txt = (btn.textContent || '').trim();
    // 우리가 관리하는 버튼만 (로그인/Sign In/MY)
    if (txt !== '로그인' && txt !== 'Sign In' && txt !== 'MY') return;
    btn.style.cssText = OUTLINE_STYLE;
    btn.classList.add('wc-my-btn');
    if (loggedIn) {
      btn.textContent = 'MY';
      btn.setAttribute('href', isEn ? 'my-progress-en.html' : 'my-progress.html');
    } else {
      btn.textContent = isEn ? 'Sign In' : '로그인';
      btn.setAttribute('href', isEn ? 'login-en.html' : 'login.html');
    }
  });
}
// 즉시 + 지연 + Supabase 세션 복원 후 세 번 시도
document.addEventListener('DOMContentLoaded', function() {
  updateNavLoginBtn();
  setTimeout(updateNavLoginBtn, 1500);
  setTimeout(updateNavLoginBtn, 3000);
});

console.log('WonderfulCrew Supabase Client v4 loaded');

// ===== 모바일 네비 드롭다운 탭 토글 =====
// 모바일에서 .nav-dropdown 의 첫 링크를 탭하면 서브메뉴 열기 (한 번 더 탭하면 이동)
(function(){
  document.addEventListener('click', function(e){
    if (window.innerWidth > 900) return;
    var anchor = e.target.closest('.nav-dropdown > a');
    if (!anchor) {
      // 바깥 탭하면 다 닫기
      document.querySelectorAll('.nav-dropdown.open').forEach(function(d){d.classList.remove('open');});
      return;
    }
    var dd = anchor.parentElement;
    if (!dd.classList.contains('open')) {
      e.preventDefault();
      // 다른 드롭다운 닫기
      document.querySelectorAll('.nav-dropdown.open').forEach(function(d){if(d!==dd)d.classList.remove('open');});
      dd.classList.add('open');
    }
  });
})();
