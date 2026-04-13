// WonderfulCrew Supabase Client v2
// 설정: login.html에서 URL/Key 입력 or Vercel 환경변수
const SUPABASE_URL = localStorage.getItem('wc_supabase_url') || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('wc_supabase_key') || 'YOUR_ANON_KEY';

let _supabase = null;
let _currentUser = null;

function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') return null;
  if (SUPABASE_URL.includes('YOUR_PROJECT')) return null;
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// ===== AUTH (세션 관리) =====
async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  const sb = getSupabase();
  if (!sb) {
    // Supabase 미설정 시 localStorage fallback
    var local = localStorage.getItem('wc_user');
    return local ? JSON.parse(local) : null;
  }
  try {
    const { data } = await sb.auth.getUser();
    if (data && data.user) {
      _currentUser = data.user;
      localStorage.setItem('wc_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || ''
      }));
      return data.user;
    }
  } catch (e) {}
  return null;
}

function getUserId() {
  var user = JSON.parse(localStorage.getItem('wc_user') || '{}');
  return user.id || 'anonymous_' + (localStorage.getItem('wc_anon_id') || (function(){var id=Math.random().toString(36).substring(2,10);localStorage.setItem('wc_anon_id',id);return id;})());
}

function isLoggedIn() {
  return !!localStorage.getItem('wc_user');
}

// 로그인 필요 시 리다이렉트
function requireLogin(msg) {
  if (!isLoggedIn()) {
    alert(msg || '로그인이 필요합니다.');
    location.href = 'login.html';
    return false;
  }
  return true;
}

// ===== STORAGE (영상 저장) =====
async function uploadToStorage(blob, path, contentType) {
  var sb = getSupabase();
  if (!sb) { console.log('Supabase not configured'); return null; }
  var userId = getUserId();
  var fullPath = 'users/' + userId + '/' + path;
  try {
    var { data, error } = await sb.storage.from('wonderfulcrew').upload(fullPath, blob, {
      contentType: contentType || 'video/webm',
      upsert: true
    });
    if (error) { console.error('Upload error:', error); return null; }
    console.log('Uploaded:', fullPath);
    return fullPath;
  } catch (e) { console.error('Upload exception:', e); return null; }
}

// 레벨테스트 영상 저장
async function saveLevelTestVideo(blob) {
  var filename = 'level_test/level_test_' + new Date().toISOString().slice(0,10) + '.webm';
  return await uploadToStorage(blob, filename, 'video/webm');
}

// 롤플레이 첫 영상 저장 (항공사별 최초 1회)
async function saveRoleplayFirstVideo(blob, airline) {
  var key = 'wc_roleplay_saved_' + (airline || 'general');
  if (localStorage.getItem(key)) { console.log('Already saved for', airline); return null; }
  var filename = 'roleplay_first/' + (airline || 'general') + '/first_' + new Date().toISOString().slice(0,10) + '.webm';
  var path = await uploadToStorage(blob, filename, 'video/webm');
  if (path) {
    localStorage.setItem(key, path);
    // DB에 기록
    await saveVideoRecord({type: 'roleplay_first', airline: airline, path: path});
  }
  return path;
}

// ===== DATABASE =====
async function saveVideoRecord(record) {
  var sb = getSupabase();
  if (!sb) return null;
  try {
    await sb.from('video_records').insert({
      user_id: getUserId(),
      type: record.type || '',
      airline: record.airline || '',
      storage_path: record.path || '',
      duration_sec: record.duration || 0,
      tag: record.tag || '',
      created_at: new Date().toISOString()
    });
  } catch (e) { console.error('DB save error:', e); }
}

async function savePracticeRecord(record) {
  var sb = getSupabase();
  if (!sb) return null;
  try {
    await sb.from('practice_records').insert({
      user_id: getUserId(),
      airline: record.airline || '',
      stage: record.stage || '',
      question: record.question || '',
      answer_text: record.answer || '',
      score: record.score || null,
      feedback: record.feedback || '',
      video_path: record.videoPath || null,
      created_at: new Date().toISOString()
    });
  } catch (e) { console.error('Save record error:', e); }
}

async function saveFeedback(feedback) {
  var sb = getSupabase();
  if (!sb) return null;
  try {
    await sb.from('ai_feedback').insert({
      user_id: getUserId(),
      page: feedback.page || '',
      question: feedback.question || '',
      student_answer: feedback.studentAnswer || '',
      ai_feedback: feedback.aiFeedback || '',
      scores: feedback.scores || {},
      created_at: new Date().toISOString()
    });
  } catch (e) {}
}

async function saveLevelResult(result) {
  var sb = getSupabase();
  if (!sb) return null;
  try {
    await sb.from('level_results').insert({
      user_id: getUserId(),
      score: result.score || 0,
      level: result.level || '',
      level_ko: result.level_ko || '',
      recommended_airlines: result.airlines || [],
      created_at: new Date().toISOString()
    });
  } catch (e) {}
}

// 관리자용: 유저 영상 목록 조회
async function getVideoRecords(limit) {
  var sb = getSupabase();
  if (!sb) return [];
  try {
    var { data } = await sb.from('video_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 50);
    return data || [];
  } catch (e) { return []; }
}

// Storage 파일 공개 URL 가져오기
function getPublicUrl(path) {
  var sb = getSupabase();
  if (!sb) return '#';
  var { data } = sb.storage.from('wonderfulcrew').getPublicUrl(path);
  return data?.publicUrl || '#';
}

console.log('WonderfulCrew Supabase Client v2 loaded. User:', getUserId());
