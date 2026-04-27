// 환불 신청 API — MY 페이지에서 사용자가 직접 호출
// 자동 거부 조건(7일 초과 / 사용 기록 있음)은 그대로 자동 거부.
// 정상 요청은 PENDING 으로 기록만 남기고 운영자가 admin 에서 검토 후 이노페이 어드민에서 수동 환불 처리.
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 1) 가장 최근 결제 1건 조회
    const { data: payment } = await sb.from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) {
      return res.json({ ok: false, decision: 'NO_PAYMENT', message: '결제 내역이 없습니다.' });
    }

    // 이미 환불 처리된 건 차단
    if (payment.status === 'refunded') {
      return res.json({ ok: false, decision: 'ALREADY_REFUNDED', message: '이미 환불 처리된 결제입니다.' });
    }

    // 2) 7일 경과 체크
    const paidAt = new Date(payment.created_at);
    const now = new Date();
    const daysSince = (now - paidAt) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      // 거부 기록 남기기
      await sb.from('refund_requests').insert({
        user_id: userId,
        email: email || '',
        payment_id: payment.id,
        decision: 'DENIED_EXPIRED',
        reason: `결제일로부터 ${Math.floor(daysSince)}일 경과 (7일 초과)`,
      });
      return res.json({
        ok: false,
        decision: 'DENIED_EXPIRED',
        message: `환불 가능 기간(7일)을 초과했습니다. 결제일로부터 ${Math.floor(daysSince)}일 경과.`,
        paidAt: payment.created_at
      });
    }

    // 3) 사용 기록 조회 — 결제일 이후 모든 활동
    const sinceISO = payment.created_at;
    const [prRes, fbRes, vrRes, pvRes] = await Promise.all([
      sb.from('practice_records').select('id, created_at').eq('user_id', userId).gte('created_at', sinceISO).limit(50),
      sb.from('ai_feedback').select('id, created_at').eq('user_id', userId).gte('created_at', sinceISO).limit(50),
      sb.from('video_records').select('id, created_at').eq('user_id', userId).gte('created_at', sinceISO).limit(50),
      sb.from('page_visits').select('id, page, visited_at').eq('user_id', userId).gte('visited_at', sinceISO).order('visited_at', { ascending: false }).limit(100)
    ]);
    const practiceCount = (prRes.data || []).length;
    const feedbackCount = (fbRes.data || []).length;
    const videoCount = (vrRes.data || []).length;
    // page_visits 는 plans/pricing/success/payment 등 결제 관련 페이지는 '이용 시작'에서 제외
    const REFUND_RELATED_PAGES = new Set(['plans.html','pricing.html','success.html','cancel.html','my-progress.html','login.html','profile-setup.html','']);
    const meaningfulVisits = (pvRes.data || []).filter(v => !REFUND_RELATED_PAGES.has((v.page || '').toLowerCase()));

    if (practiceCount > 0 || feedbackCount > 0 || videoCount > 0 || meaningfulVisits.length > 0) {
      // 사용 시작 — 거부
      await sb.from('refund_requests').insert({
        user_id: userId,
        email: email || '',
        payment_id: payment.id,
        decision: 'DENIED_USED',
        reason: `결제 후 사용 기록 발견 — 연습 ${practiceCount}건 / AI 피드백 ${feedbackCount}건 / 영상 ${videoCount}건 / 페이지 방문 ${meaningfulVisits.length}회`,
      });
      const evidence = {
        practice: practiceCount,
        feedback: feedbackCount,
        video: videoCount,
        page_visits: meaningfulVisits.length,
        last_pages: meaningfulVisits.slice(0, 5).map(v => ({ page: v.page, at: v.visited_at }))
      };
      return res.json({
        ok: false,
        decision: 'DENIED_USED',
        message: '결제 후 이용 기록이 확인되어 환불이 불가합니다. (디지털 콘텐츠 약관)',
        evidence,
        paidAt: payment.created_at
      });
    }

    // 4) 자동 거부 조건 통과 — PENDING 으로 기록만 (DB 환불 처리·구독 해지 X)
    // 운영자가 admin 에서 검토 후 이노페이 어드민에서 수동 환불 → 그 시점에 admin/approve API 로 DB 동기화
    await sb.from('refund_requests').insert({
      user_id: userId,
      email: email || '',
      payment_id: payment.id,
      decision: 'PENDING',
      reason: '7일 이내 + 사용 기록 0건 — 운영자 수동 승인 대기',
      amount: payment.amount || 0,
      tid: payment.tid || ''
    });

    return res.json({
      ok: true,
      decision: 'PENDING',
      message: '환불 요청이 접수되었습니다. 운영자가 검토 후 영업일 기준 1~2일 내에 카드 취소 처리됩니다.',
      amount: payment.amount || 0,
      tid: payment.tid || '',
      paidAt: payment.created_at
    });
  } catch (e) {
    console.error('[request-refund] error:', e);
    res.status(500).json({ error: e.message });
  }
};
