// Vercel Hobby 12-function limit 우회 — 모든 /api/* 요청을 단일 catch-all 함수로 처리
// 각 핸들러는 require()로 번들에 포함됨. 원본 파일들은 .vercelignore로 함수 카운트 제외.

const ROUTES = {
  'admin-data':               require('./_admin-data'),
  'admin-force-activate':     require('./_admin-force-activate'),
  'ai':                       require('./_ai'),
  'analyze-growth':           require('./_analyze-growth'),
  'approve-deposit':          require('./_approve-deposit'),
  'backfill-payment':         require('./_backfill-payment'),
  'cancel-subscription':      require('./_cancel-subscription'),
  'create-checkout':          require('./_create-checkout'),
  'create-subscription':      require('./_create-subscription'),
  'did-lipsync':              require('./_did-lipsync'),
  'ebook-unlock':             require('./_ebook-unlock'),
  'email-campaign-cron':      require('./_email-campaign-cron'),
  'env-check':                require('./_env-check'),
  'gen-edit':                 require('./_gen-edit'),
  'generate-sns-content':     require('./_generate-sns-content'),
  'heal-plan-active':         require('./_heal-plan-active'),
  'image-check':              require('./_image-check'),
  'innopay-confirm':          require('./_innopay-confirm'),
  'innopay-prepare':          require('./_innopay-prepare'),
  'innopay-webhook':          require('./_innopay-webhook'),
  'marketing-push-cron':      require('./_marketing-push-cron'),
  'news':                     require('./_news'),
  'partner-inquiry':          require('./_partner-inquiry'),
  'paypal-capture-order':     require('./_paypal-capture-order'),
  'paypal-config':            require('./_paypal-config'),
  'paypal-create-order':      require('./_paypal-create-order'),
  'paypal-create-subscription': require('./_paypal-create-subscription'),
  'paypal-setup-plans':       require('./_paypal-setup-plans'),
  'paypal-setup-webhook':     require('./_paypal-setup-webhook'),
  'paypal-subscription-record': require('./_paypal-subscription-record'),
  'paypal-subtest':           require('./_paypal-subtest'),
  'paypal-webhook':           require('./_paypal-webhook'),
  'photo-finish':             require('./_photo-finish'),
  'push-send':                require('./_push-send'),
  'push-subscribe':           require('./_push-subscribe'),
  'reconcile-subscriptions':  require('./_reconcile-subscriptions'),
  'request-deposit':          require('./_request-deposit'),
  'request-refund':           require('./_request-refund'),
  'save-payment':             require('./_save-payment'),
  'save-profile':             require('./_save-profile'),
  'search':                   require('./_search'),
  'seminar-signup':           require('./_seminar-signup'),
  'seo-ping':                 require('./_seo-ping'),
  'sns-publish':              require('./_sns-publish'),
  'sns-queue-list':           require('./_sns-queue-list'),
  'solapi-send':              require('./_solapi-send'),
  'stt':                      require('./_stt'),
  'supabase-config':          require('./_supabase-config'),
  'track-visit':              require('./_track-visit'),
  'tts':                      require('./_tts'),
  'vapid-public':             require('./_vapid-public'),
};

module.exports = async function(req, res) {
  const { slug, ...restQuery } = req.query;
  const key = Array.isArray(slug) ? slug[0] : (slug || '');
  req.query = restQuery;

  const handler = ROUTES[key];
  if (!handler) return res.status(404).json({ error: 'not found', path: key });

  const fn = typeof handler === 'function' ? handler : (handler.default || handler);
  return fn(req, res);
};
