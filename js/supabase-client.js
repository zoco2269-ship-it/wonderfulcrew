// WonderfulCrew Supabase Client
// 환경설정: Supabase 프로젝트 URL과 Anon Key를 아래에 입력하세요
const SUPABASE_URL = localStorage.getItem('wc_supabase_url') || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('wc_supabase_key') || 'YOUR_ANON_KEY';

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase === 'undefined') {
    console.warn('Supabase SDK not loaded');
    return null;
  }
  if (SUPABASE_URL.includes('YOUR_PROJECT')) {
    console.warn('Supabase not configured yet');
    return null;
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// 현재 로그인 유저 가져오기
async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  } catch (e) { return null; }
}

// ===== STORAGE =====

// 비디오 업로드
async function uploadVideo(blob, filename) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) { console.log('Not logged in or Supabase not configured'); return null; }

  const path = `users/${user.id}/videos/${filename}`;
  const { data, error } = await sb.storage.from('wonderfulcrew').upload(path, blob, {
    contentType: 'video/webm',
    upsert: true
  });
  if (error) { console.error('Video upload error:', error); return null; }
  return data.path;
}

// 오디오 업로드
async function uploadAudio(blob, filename) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;

  const path = `users/${user.id}/audio/${filename}`;
  const { data, error } = await sb.storage.from('wonderfulcrew').upload(path, blob, {
    contentType: 'audio/webm',
    upsert: true
  });
  if (error) { console.error('Audio upload error:', error); return null; }
  return data.path;
}

// ===== DATABASE =====

// 연습 기록 저장
async function savePracticeRecord(record) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;

  const { data, error } = await sb.from('practice_records').insert({
    user_id: user.id,
    airline: record.airline || '',
    stage: record.stage || '',
    question: record.question || '',
    answer_text: record.answer || '',
    score: record.score || null,
    feedback: record.feedback || '',
    video_path: record.videoPath || null,
    audio_path: record.audioPath || null,
    created_at: new Date().toISOString()
  });
  if (error) console.error('Save record error:', error);
  return data;
}

// AI 피드백 저장
async function saveFeedback(feedback) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;

  const { data, error } = await sb.from('ai_feedback').insert({
    user_id: user.id,
    page: feedback.page || '',
    question: feedback.question || '',
    student_answer: feedback.studentAnswer || '',
    ai_feedback: feedback.aiFeedback || '',
    model_answer: feedback.modelAnswer || '',
    scores: feedback.scores || {},
    created_at: new Date().toISOString()
  });
  if (error) console.error('Save feedback error:', error);
  return data;
}

// 레벨 테스트 결과 저장
async function saveLevelResult(result) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;

  const { data, error } = await sb.from('level_results').insert({
    user_id: user.id,
    score: result.score || 0,
    level: result.level || '',
    level_ko: result.level_ko || '',
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    recommended_airlines: result.airlines || [],
    created_at: new Date().toISOString()
  });
  if (error) console.error('Save level result error:', error);
  return data;
}

// 연습 기록 조회 (최근 N개)
async function getPracticeRecords(limit) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return [];

  const { data, error } = await sb.from('practice_records')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit || 10);
  return data || [];
}

// 출석 기록 저장
async function saveAttendance() {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb.from('attendance').upsert({
    user_id: user.id,
    date: today
  }, { onConflict: 'user_id,date' });
  return data;
}

console.log('WonderfulCrew Supabase client loaded');
