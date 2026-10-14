function tryRequire(path) {
  try { return require(path); } catch(e) { return null; }
}

const ROUTES = {
  'admin-data':               () => tryRequire('./_admin-data'),
  'admin-force-activate':     () => tryRequire('./_admin-force-activate'),
  'ai':                       () => tryRequire('./_ai'),
  'analyze-growth':           () => tryRequire('./_analyze-growth'),
  'approve-deposit':          () => tryRequire('./_approve-deposit'),
  'backfill-payment':         () => tryRequire('./_backfill-payment'),
  'cancel-subscription':      () => tryRequire('./_cancel-subscription'),
  'create-checkout':          () => tryRequire('./_create-checkout'),
  'create-subscription':      () => tryRequire('./_create-subscription'),
  'did-lipsync':              () => tryRequire('./_did-lipsync'),
  'ebook-unlock':             () => tryRequire('./_ebook-unlock'),
  'email-campaign-cron':      () => tryRequire('./_email-campaign-cron'),
  'env-check':                () => tryRequire('./_env-check'),
  'gen-edit':                 () => tryRequire('./_gen-edit'),
  'generate-sns-content':     () => tryRequire('./_generate-sns-content'),
  'heal-plan-active':         () => tryRequire('./_heal-plan-active'),
  'image-check':              () => tryRequire('./_image-check'),
  'innopay-confirm':          () => tryRequire('./_innopay-confirm'),
  'innopay-prepare':          () => tryRequire('./_innopay-prepare'),
  'innopay-webhook':          () => tryRequire('./_innopay-webhook'),
  'marketing-push-cron':      () => tryRequire('./_marketing-push-cron'),
  'news':                     () => tryRequire('./_news'),
  'partner-inquiry':          () => tryRequire('./_partner-inquiry'),
  'paypal-capture-order':     () => tryRequire('./_paypal-capture-order'),
  'paypal-config':            () => tryRequire('./_paypal-config'),
  'paypal-create-order':      () => tryRequire('./_paypal-create-order'),
  'paypal-create-subscription': () => tryRequire('./_paypal-create-subscription'),
  'paypal-setup-plans':       () => tryRequire('./_paypal-setup-plans'),
  'paypal-setup-webhook':     () => tryRequire('./_paypal-setup-webhook'),
  'paypal-subscription-record': () => tryRequire('./_paypal-subscription-record'),
  'paypal-subtest':           () => tryRequire('./_paypal-subtest'),
  'paypal-webhook':           () => tryRequire('./_paypal-webhook'),
  'photo-finish':             () => tryRequire('./_photo-finish'),
  'push-send':                () => tryRequire('./_push-send'),
  'push-subscribe':           () => tryRequire('./_push-subscribe'),
  'reconcile-subscriptions':  () => tryRequire('./_reconcile-subscriptions'),
  'request-deposit':          () => tryRequire('./_request-deposit'),
  'request-refund':           () => tryRequire('./_request-refund'),
  'save-payment':             () => tryRequire('./_save-payment'),
  'save-profile':             () => tryRequire('./_save-profile'),
  'search':                   () => tryRequire('./_search'),
  'seminar-signup':           () => tryRequire('./_seminar-signup'),
  'seo-ping':                 () => tryRequire('./_seo-ping'),
  'sns-publish':              () => tryRequire('./_sns-publish'),
  'sns-queue-list':           () => tryRequire('./_sns-queue-list'),
  'solapi-send':              () => tryRequire('./_solapi-send'),
  'stt':                      () => tryRequire('./_stt'),
  'track-visit':              () => tryRequire('./_track-visit'),
  'tts':                      () => tryRequire('./_tts'),
  'vapid-public':             () => tryRequire('./_vapid-public'),
};

module.exports = async function(req, res) {
  const slug = req.query.slug;
  const key = Array.isArray(slug) ? slug[0] : (slug || '');

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
