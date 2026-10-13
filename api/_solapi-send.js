// Solapi 메시지 발송 API (카카오 알림톡 + SMS)
// 환경변수: SOLAPI_API_KEY, SOLAPI_API_SECRET

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // 관리자 인증
  const authHeader = req.headers.authorization || '';
  const adminKey = process.env.PUSH_ADMIN_KEY || 'wc-push-admin-2026';
  if (authHeader !== 'Bearer ' + adminKey) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const API_KEY = process.env.SOLAPI_API_KEY;
  const API_SECRET = process.env.SOLAPI_API_SECRET;
  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'SOLAPI credentials not configured' });
  }

  const { type, to, text, subject, pfId, templateId } = req.body || {};
  // type: 'SMS', 'LMS', 'KAKAO'
  // to: 전화번호 (단일 또는 배열)
  // text: 메시지 본문
  // subject: LMS 제목 (선택)
  // pfId: 카카오 발신프로필 ID (알림톡용)
  // templateId: 카카오 알림톡 템플릿 ID

  if (!to || !text) {
    return res.status(400).json({ error: 'to and text required' });
  }

  try {
    // Solapi HMAC 인증 헤더 생성
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString('hex');
    const signature = crypto.createHmac('sha256', API_SECRET)
      .update(date + salt)
      .digest('hex');

    const authToken = 'HMAC-SHA256 apiKey=' + API_KEY + ', date=' + date + ', salt=' + salt + ', signature=' + signature;

    // 수신자 배열 처리
    const recipients = Array.isArray(to) ? to : [to];

    // 메시지 구성
    var messages = recipients.map(function(phone) {
      var msg = {
        to: phone.replace(/-/g, ''),
        from: process.env.SOLAPI_SENDER || '01000000000', // 발신번호 (인증 필요)
        text: text
      };

      if (type === 'KAKAO' && pfId && templateId) {
        msg.type = 'ATA'; // 알림톡
        msg.kakaoOptions = {
          pfId: pfId,
          templateId: templateId
        };
      } else if (type === 'LMS' || text.length > 90) {
        msg.type = 'LMS';
        msg.subject = subject || 'WonderfulCrew';
      } else {
        msg.type = 'SMS';
      }

      return msg;
    });

    // Solapi API 호출
    const response = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({ messages: messages })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.errorMessage || JSON.stringify(data) });
    }

    res.json({
      ok: true,
      groupId: data.groupId,
      count: {
        total: data.messageCount?.total || recipients.length,
        sent: data.messageCount?.sentSuccess || 0,
        failed: data.messageCount?.sentFailed || 0
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
