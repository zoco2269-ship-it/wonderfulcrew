// WonderfulCrew Supabase Client v4
// Vercel 환경변수에서 자동으로 설정 로드

let _supabase = null;
let _currentUser = null;
let _supabaseReady = false;

var ADMIN_EMAILS = ['zoco2269@gmail.com'];

// 서버에서 Supabase 설정 로드
(async function initSupabase(){
  try {
    var res = await fetch('/api/supabase-config');
    var cfg = await res.json();
    if (cfg.url && cfg.anonKey && typeof window.supabase !== 'undefined') {
      _supabase = window.supabase.createClient(cfg.url, cfg.anonKey);
      _supabaseReady = true;
      // 세션 체크
      var { data } = await _supabase.auth.getSession();
      if (data && data.session && data.session.user) {
        _currentUser = data.session.user;
        localStorage.setItem('wc_user', JSON.stringify({
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.user_metadata?.full_name || '',
          avatar: data.session.user.user_metadata?.avatar_url || ''
        }));
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
    options: { redirectTo: window.location.origin + '/login.html' }
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
  var protectedPages = ['roleplay-practice.html','roleplay-practice-en.html','roleplay-practice-ko.html','roleplay.html','discussion-practice-ko.html','discussion-practice.html','discussion1.html','discussion2.html','final.html','video-practice.html','leveltest.html','leveltest-en.html','interview-practice.html','ai-coach.html','ai-coach-en.html','chatbot.html','chatbot-en.html','coach-feedback.html','coach-feedback-en.html','my-progress.html','my-progress-en.html','settings.html','settings-en.html','admin.html'];
  if (protectedPages.indexOf(page) === -1) return;
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

console.log('WonderfulCrew Supabase Client v3 loaded');
