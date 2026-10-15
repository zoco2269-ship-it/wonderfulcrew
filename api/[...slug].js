function tryRequire(path) {
  try { return require(path); } catch(e) { return null; }
}

const ROUTES = {
  'admin-data':               () => tryRequire('./admin-data'),
  'admin-force-activate':     () => tryRequire('./admin-force-activate'),
  'ai':                       () => tryRequire('./ai'),
  'analyze-growth':           () => tryRequire('./analyze-growth'),
  'approve-deposit':          () => tryRequire('./approve-deposit'),
  'backfill-payment':         () => tryRequire('./backfill-payment'),
  'cancel-subscription':      () => tryRequire('./cancel-subscription'),
  'create-checkout':          () => tryRequire('./create-checkout'),
  'create-subscription':      () => tryRequire('./create-subscription'),
  'did-lipsync':              () => tryRequire('./did-lipsync'),
  'ebook-unlock':             () => tryRequire('./ebook-unlock'),
  'email-campaign-cron':      () => tryRequire('./email-campaign-cron'),
  'env-check':                () => tryRequire('./env-check'),
  'gen-edit':                 () => tryRequire('./gen-edit'),
  'generate-sns-content':     () => tryRequire('./generate-sns-content'),
  'heal-plan-active':         () => tryRequire('./heal-plan-active'),
  'image-check':              () => tryRequire('./image-check'),
  'innopay-confirm':          () => tryRequire('./innopay-confirm'),
  'innopay-prepare':          () => tryRequire('./innopay-prepare'),
  'innopay-webhook':          () => tryRequire('./innopay-webhook'),
  'marketing-push-cron':      () => tryRequire('./marketing-push-cron'),
  'news':                     () => tryRequire('./news'),
  'partner-inquiry':          () => tryRequire('./partner-inquiry'),
  'paypal-capture-order':     () => tryRequire('./paypal-capture-order'),
  'paypal-config':            () => tryRequire('./paypal-config'),
  'paypal-create-order':      () => tryRequire('./paypal-create-order'),
  'paypal-create-subscription': () => tryRequire('./paypal-create-subscription'),
  'paypal-setup-plans':       () => tryRequire('./paypal-setup-plans'),
  'paypal-setup-webhook':     () => tryRequire('./paypal-setup-webhook'),
  'paypal-subscription-record': () => tryRequire('./paypal-subscription-record'),
  'paypal-subtest':           () => tryRequire('./paypal-subtest'),
  'paypal-webhook':           () => tryRequire('./paypal-webhook'),
  'photo-finish':             () => tryRequire('./photo-finish'),
  'push-send':                () => tryRequire('./push-send'),
  'push-subscribe':           () => tryRequire('./push-subscribe'),
  'reconcile-subscriptions':  () => tryRequire('./reconcile-subscriptions'),
  'request-deposit':          () => tryRequire('./request-deposit'),
  'request-refund':           () => tryRequire('./request-refund'),
  'save-payment':             () => tryRequire('./save-payment'),
  'save-profile':             () => tryRequire('./save-profile'),
  'search':                   () => tryRequire('./search'),
  'seminar-signup':           () => tryRequire('./seminar-signup'),
  'seo-ping':                 () => tryRequire('./seo-ping'),
  'sns-publish':              () => tryRequire('./sns-publish'),
  'sns-queue-list':           () => tryRequire('./sns-queue-list'),
  'solapi-send':              () => tryRequire('./solapi-send'),
  'stt':                      () => tryRequire('./stt'),
  'track-visit':              () => tryRequire('./track-visit'),
  'tts':                      () => tryRequire('./tts'),
  'vapid-public':             () => tryRequire('./vapid-public'),
};

module.exports = async function(req, res) {
  // req.query.slug 대신 URL에서 직접 파싱 (Vercel 라우팅 파라미터 불일치 방지)
  const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  // parts: ['api', 'supabase-config'] or ['supabase-config']
  const key = parts[parts.length - 1] || '';

  // supabase-config는 외부 의존성 없이 직접 처리
  if (key === 'supabase-config') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
    });
  }

  const factory = ROUTES[key];
  if (!factory) return res.status(404).json({ error: 'not found', path: key });

  const mod = factory();
  if (!mod) return res.status(500).json({ error: 'handler load failed', path: key });

  const fn = typeof mod === 'function' ? mod : (mod.default || mod);
  return fn(req, res);
};
