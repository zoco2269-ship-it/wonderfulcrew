// SNS 자동 발행 — Vercel cron 매시간 1개씩
// sns_content_queue 에서 status='pending' 1개 fetch → 채널별 발행 → status='posted'
// 환경변수로 채널 토큰 관리. 토큰 없는 채널은 자동 skip.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 인증
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers && (req.headers.authorization || req.headers['x-cron-secret'] || '');
  const isVercelCron = req.headers && req.headers['user-agent'] && req.headers['user-agent'].indexOf('vercel-cron') !== -1;
  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  const isAuthed = isVercelCron ||
    (cronSecret && authHeader.indexOf(cronSecret) !== -1) ||
    ADMIN_EMAILS.indexOf(adminEmail) !== -1;
  if (!isAuthed) return res.status(403).json({ error: 'unauthorized' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const channels = [];
  const results = { posted: [], skipped: [], errors: [] };

  // 큐에서 가장 오래된 pending 1개 fetch
  const { data: queue, error: qerr } = await sb.from('sns_content_queue')
    .select('id, text, title_short, hashtags, persona, lang, topic, status')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);
  if (qerr || !queue || !queue.length) {
    return res.json({ ok: true, message: 'no pending content', queue_empty: true });
  }
  const item = queue[0];

  // 발행 대상 텍스트 (해시태그 포함)
  const fullText = `${item.text}\n\n${item.hashtags || ''}`.trim();

  // 카드 이미지 URL (인스타·페이스북용)
  const cardUrl = `https://wonderfulcrew.com/api/og-card?title=${encodeURIComponent(item.title_short || item.topic.slice(0,30))}&subtitle=${encodeURIComponent(item.persona === 'coach' ? '7년차 에미레이트 출신 코치' : item.persona === 'mentor' ? '13년 경력 면접 멘토' : item.persona === 'success' ? '합격생 후기' : '데이터 인사이트')}&tag=${encodeURIComponent(item.lang === 'en' ? 'CABIN CREW INSIGHT' : '원더풀크루 인사이트')}`;

  // ─── 1) Threads (Meta) ───
  const threadsToken = process.env.THREADS_ACCESS_TOKEN;
  const threadsUserId = process.env.THREADS_USER_ID;
  if (threadsToken && threadsUserId) {
    try {
      // (a) 컨테이너 생성
      const c = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads?media_type=TEXT&text=${encodeURIComponent(fullText)}&access_token=${threadsToken}`, { method: 'POST' });
      const cd = await c.json();
      if (cd.id) {
        // (b) 발행
        const p = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish?creation_id=${cd.id}&access_token=${threadsToken}`, { method: 'POST' });
        const pd = await p.json();
        if (pd.id) results.posted.push({ channel: 'threads', id: pd.id });
        else results.errors.push({ channel: 'threads', error: pd });
      } else {
        results.errors.push({ channel: 'threads', error: cd });
      }
    } catch (e) { results.errors.push({ channel: 'threads', exception: e.message }); }
  } else {
    results.skipped.push({ channel: 'threads', reason: 'token missing' });
  }

  // ─── 2) Facebook 페이지 ───
  const fbPageId = process.env.FB_PAGE_ID;
  const fbPageToken = process.env.FB_PAGE_ACCESS_TOKEN;
  if (fbPageId && fbPageToken) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cardUrl,
          caption: fullText,
          access_token: fbPageToken
        })
      });
      const d = await r.json();
      if (d.id) results.posted.push({ channel: 'facebook', id: d.id });
      else results.errors.push({ channel: 'facebook', error: d });
    } catch (e) { results.errors.push({ channel: 'facebook', exception: e.message }); }
  } else {
    results.skipped.push({ channel: 'facebook', reason: 'token missing' });
  }

  // ─── 3) Instagram (Graph API) ───
  const igUserId = process.env.IG_USER_ID;
  const igToken = process.env.IG_ACCESS_TOKEN; // 보통 fbPageToken 과 동일
  if (igUserId && igToken) {
    try {
      // (a) 미디어 컨테이너 생성
      const c = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: cardUrl,
          caption: fullText,
          access_token: igToken
        })
      });
      const cd = await c.json();
      if (cd.id) {
        // 약간 대기 (이미지 처리 시간)
        await new Promise(r => setTimeout(r, 3000));
        // (b) 발행
        const p = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: cd.id, access_token: igToken })
        });
        const pd = await p.json();
        if (pd.id) results.posted.push({ channel: 'instagram', id: pd.id });
        else results.errors.push({ channel: 'instagram', error: pd });
      } else {
        results.errors.push({ channel: 'instagram', error: cd });
      }
    } catch (e) { results.errors.push({ channel: 'instagram', exception: e.message }); }
  } else {
    results.skipped.push({ channel: 'instagram', reason: 'token missing' });
  }

  // ─── 4) X (Twitter) — OAuth 1.0a User Context ───
  // X v2 free tier: 1,500 트윗/월. App-only Bearer 는 read-only 라 트윗 작성 불가.
  // 필요 환경변수 4종: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
  // (X Developer Portal → 앱 → Keys and tokens 에서 모두 발급)
  const xKey = process.env.X_API_KEY;
  const xSecret = process.env.X_API_SECRET;
  const xToken = process.env.X_ACCESS_TOKEN;
  const xTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (xKey && xSecret && xToken && xTokenSecret) {
    try {
      const oauth = OAuth({
        consumer: { key: xKey, secret: xSecret },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        }
      });
      const reqData = { url: 'https://api.twitter.com/2/tweets', method: 'POST' };
      const authHeader = oauth.toHeader(oauth.authorize(reqData, { key: xToken, secret: xTokenSecret }));
      const r = await fetch(reqData.url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: fullText.slice(0, 280) })
      });
      const d = await r.json();
      if (d.data && d.data.id) results.posted.push({ channel: 'x', id: d.data.id });
      else results.errors.push({ channel: 'x', error: d });
    } catch (e) { results.errors.push({ channel: 'x', exception: e.message }); }
  } else {
    results.skipped.push({ channel: 'x', reason: 'token missing (X_API_KEY/SECRET, X_ACCESS_TOKEN/SECRET 4종 필요)' });
  }

  // 큐 상태 업데이트
  const finalStatus = results.posted.length > 0 ? 'posted' : 'failed';
  try {
    await sb.from('sns_content_queue').update({
      status: finalStatus,
      posted_at: new Date().toISOString(),
      result: JSON.stringify(results),
    }).eq('id', item.id);
  } catch (e) {
    results.errors.push({ channel: 'db_update', error: e.message });
  }

  return res.json({
    ok: true,
    item_id: item.id,
    topic: item.topic,
    persona: item.persona,
    final_status: finalStatus,
    results: results,
  });
};
