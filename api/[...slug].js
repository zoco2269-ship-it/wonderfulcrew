// Vercel Hobby 12-function limit 우회 — 모든 /api/* 요청을 단일 catch-all 함수로 처리
// 각 핸들러는 require()로 번들에 포함됨. 원본 파일들은 .vercelignore로 함수 카운트 제외.

const ROUTES = {
  'admin-data':               require('./admin-data'),
  'admin-force-activate':     require('./admin-force-activate'),
  'ai':                       require('./ai'),
  'analyze-growth':           require('./analyze-growth'),
  'approve-deposit':          require('./approve-deposit'),
  'backfill-payment':         require('./backfill-payment'),
  'cancel-subscription':      require('./cancel-subscription'),
  'create-checkout':          require('./create-checkout'),
  'create-subscription':      require('./create-subscription'),
  'did-lipsync':              require('./did-lipsync'),
  'ebook-unlock':             require('./ebook-unlock'),
  'email-campaign-cron':      require('./email-campaign-cron'),
  'env-check':                require('./env-check'),
  'gen-edit':                 require('./gen-edit'),
  'generate-sns-content':     require('./generate-sns-content'),
  'heal-plan-active':         require('./heal-plan-active'),
  'image-check':              require('./image-check'),
  'innopay-confirm':          require('./innopay-confirm'),
  'innopay-prepare':          require('./innopay-prepare'),
  'innopay-webhook':          require('./innopay-webhook'),
  'marketing-push-cron':      require('./marketing-push-cron'),
  'news':                     require('./news'),
  'partner-inquiry':          require('./partner-inquiry'),
  'paypal-capture-order':     require('./paypal-capture-order'),
  'paypal-config':            require('./paypal-config'),
  'paypal-create-order':      require('./paypal-create-order'),
  'paypal-create-subscription': require('./paypal-create-subscription'),
  'paypal-setup-plans':       require('./paypal-setup-plans'),
  'paypal-setup-webhook':     require('./paypal-setup-webhook'),
  'paypal-subscription-record': require('./paypal-subscription-record'),
  'paypal-subtest':           require('./paypal-subtest'),
  'paypal-webhook':           require('./paypal-webhook'),
  'photo-finish':             require('./photo-finish'),
  'push-send':                require('./push-send'),
  'push-subscribe':           require('./push-subscribe'),
  'reconcile-subscriptions':  require('./reconcile-subscriptions'),
  'request-deposit':          require('./request-deposit'),
  'request-refund':           require('./request-refund'),
  'save-payment':             require('./save-payment'),
  'save-profile':             require('./save-profile'),
  'search':                   require('./search'),
  'seminar-signup':           require('./seminar-signup'),
  'seo-ping':                 require('./seo-ping'),
  'sns-publish':              require('./sns-publish'),
  'sns-queue-list':           require('./sns-queue-list'),
  'solapi-send':              require('./solapi-send'),
  'stt':                      require('./stt'),
  'supabase-config':          require('./supabase-config'),
  'track-visit':              require('./track-visit'),
  'tts':                      require('./tts'),
  'vapid-public':             require('./vapid-public'),
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
