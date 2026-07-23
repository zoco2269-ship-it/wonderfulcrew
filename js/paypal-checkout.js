/**
 * WonderfulCrew — PayPal checkout (English / international pages).
 *   wcRenderSubscription('paypal-basic', 'basic')   // Basic / Elite monthly subscription
 *   wcRenderOneTime('paypal-premium', 'premium')    // Premium one-time payment
 *
 * A page must use ONLY subscriptions OR ONLY one-time (PayPal SDK "intent" differs per page).
 * Client id + plan ids come from /api/paypal-config (env-driven). Keys stay server-side.
 */
(function () {
  var cfgPromise = null, sdkPromise = null;

  function getConfig() {
    if (!cfgPromise) cfgPromise = fetch('/api/paypal-config').then(function (r) { return r.json(); });
    return cfgPromise;
  }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('wc_user') || '{}'); } catch (e) { return {}; }
  }
  function markError(containerId, msg) {
    var el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div style="color:#c0392b;font-size:0.8rem;padding:8px 4px;text-align:center;">' + msg + '</div>';
  }
  function setLocalPaid(plan) {
    try {
      localStorage.setItem('wc_paid', 'true');
      localStorage.setItem('wc_paid_date', new Date().toISOString());
      localStorage.setItem('wc_plan', plan);
    } catch (e) {}
  }
  function loadSdk(cfg, intent) {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      if (!cfg.clientId) { reject(new Error('PayPal is not configured yet.')); return; }
      var params = 'client-id=' + encodeURIComponent(cfg.clientId) + '&currency=' + (cfg.currency || 'USD');
      if (intent === 'subscription') params += '&vault=true&intent=subscription';
      else params += '&intent=capture';
      var s = document.createElement('script');
      s.src = 'https://www.paypal.com/sdk/js?' + params;
      s.onload = function () { resolve(window.paypal); };
      s.onerror = function () { reject(new Error('Failed to load PayPal.')); };
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  window.wcRenderSubscription = async function (containerId, plan) {
    try {
      var cfg = await getConfig();
      var planId = (plan === 'elite') ? cfg.planElite : cfg.planBasic;
      if (!cfg.clientId) { markError(containerId, 'PayPal is not configured yet.'); return; }
      if (!planId) { markError(containerId, 'This subscription plan is not set up yet.'); return; }
      var paypal = await loadSdk(cfg, 'subscription');
      var user = getUser();
      paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' },
        createSubscription: function (data, actions) {
          return actions.subscription.create({
            plan_id: planId,
            custom_id: plan + ':' + (user.id || user.email || '')
          });
        },
        onApprove: async function (data) {
          try {
            await fetch('/api/paypal-subscription-record', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriptionID: data.subscriptionID, plan: plan, userId: user.id || '', email: user.email || '', name: user.name || '' })
            });
          } catch (e) {}
          setLocalPaid(plan);
          location.href = 'success-en.html?plan=' + plan;
        },
        onError: function (err) { markError(containerId, 'Payment error. Please try again.'); console.error('[paypal]', err); }
      }).render('#' + containerId);
    } catch (e) { markError(containerId, e.message); }
  };

  window.wcRenderOneTime = async function (containerId, plan) {
    try {
      var cfg = await getConfig();
      if (!cfg.clientId) { markError(containerId, 'PayPal is not configured yet.'); return; }
      var paypal = await loadSdk(cfg, 'capture');
      var user = getUser();
      paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'pay' },
        createOrder: async function () {
          var r = await fetch('/api/paypal-create-order', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: plan, userId: user.id || '', email: user.email || '' })
          });
          var d = await r.json();
          if (d.error) throw new Error(d.error);
          return d.id;
        },
        onApprove: async function (data) {
          // One-time orders are only AUTHORIZED here — the server capture is what takes the money.
          // Only mark paid + redirect if the capture actually succeeded.
          try {
            var r = await fetch('/api/paypal-capture-order', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID, plan: plan, userId: user.id || '', email: user.email || '', name: user.name || '' })
            });
            var d = await r.json();
            if (!r.ok || !d.ok) { markError(containerId, 'We could not confirm your payment. Please contact WonderfulCrew — you have not been charged.'); return; }
          } catch (e) {
            markError(containerId, 'We could not confirm your payment. Please try again.'); return;
          }
          setLocalPaid(plan);
          location.href = 'success-en.html?plan=' + plan;
        },
        onError: function (err) { markError(containerId, 'Payment error. Please try again.'); console.error('[paypal]', err); }
      }).render('#' + containerId);
    } catch (e) { markError(containerId, e.message); }
  };
})();
