// SEO 자동 ping — 검색 엔진에 sitemap 갱신 알림
// Google · Bing · Yandex 무료 ping endpoint 활용
// 매일 1회 cron + sitemap 갱신될 때마다 트리거 가능
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers && (req.headers.authorization || req.headers['x-cron-secret'] || '');
  const isVercelCron = req.headers && req.headers['user-agent'] && req.headers['user-agent'].indexOf('vercel-cron') !== -1;
  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  if (!isVercelCron && !(cronSecret && authHeader.indexOf(cronSecret) !== -1) && ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const sitemapUrl = encodeURIComponent('https://www.wonderfulcrew.com/sitemap.xml');
  const pings = [
    // Google ping endpoint (deprecated 2023 — IndexNow 권장)
    { name: 'Google',     url: 'https://www.google.com/ping?sitemap=' + sitemapUrl },
    // Bing IndexNow (Bing·Yandex·Naver 등 IndexNow 지원 검색 엔진 모두 알림)
    { name: 'IndexNow',   url: 'https://api.indexnow.org/indexnow?url=' + encodeURIComponent('https://www.wonderfulcrew.com/') + '&key=' + (process.env.INDEXNOW_KEY || 'wonderfulcrew2026') },
    // Yandex ping
    { name: 'Yandex',     url: 'https://webmaster.yandex.com/ping?sitemap=' + sitemapUrl },
  ];

  const results = [];
  for (const p of pings) {
    try {
      const r = await fetch(p.url, { method: 'GET' });
      results.push({ name: p.name, status: r.status, ok: r.ok });
    } catch (e) {
      results.push({ name: p.name, error: e.message });
    }
  }

  return res.json({
    ok: true,
    sitemap: 'https://www.wonderfulcrew.com/sitemap.xml',
    runAt: new Date().toISOString(),
    results: results,
    note: '구글은 ping endpoint deprecated. Search Console 자동 크롤 + IndexNow (Bing·Yandex·Naver) 가 핵심.'
  });
};
