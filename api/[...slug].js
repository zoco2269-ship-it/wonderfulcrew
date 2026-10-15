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
  'track-visit':              require('./_track-visit'),
  'tts':                      require('./_tts'),
  'vapid-public':             require('./_vapid-public'),
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
