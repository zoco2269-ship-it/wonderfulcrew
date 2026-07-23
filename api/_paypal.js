// Shared PayPal helpers + plan config (server-side helper, NOT an endpoint — underscore prefix is ignored by Vercel routing).
// Used by api/paypal-*.js. Reuses the same Supabase tables as save-payment.js.
const { createClient } = require('@supabase/supabase-js');

// =========================================================================
//  USD PRICES — PLACEHOLDERS. Adjust the amounts here in ONE place.
//  (For subscriptions, after changing an amount you must re-run
//   /api/paypal-setup-plans to create new PayPal plans and update the
//   PAYPAL_PLAN_BASIC / PAYPAL_PLAN_ELITE env vars.)
// =========================================================================
const CURRENCY = 'USD';
const PLANS = {
  basic:   { amount: '149.00',  interval_unit: 'MONTH', interval_count: 1, name: 'WonderfulCrew Basic — Monthly',  desc: '500 usage / month' },
  elite:   { amount: '219.00',  interval_unit: 'MONTH', interval_count: 1, name: 'WonderfulCrew Elite — Monthly',  desc: '1,200 usage / month + AI Coach' },
  premium: { amount: '1850.00', name: 'WonderfulCrew Premium Success Package (1 Year)', desc: 'One-time payment · 1 year access' } // one-time
};

function apiBase() {
  return (process.env.PAYPAL_MODE === 'live')
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error('PayPal credentials not configured (PAYPAL_CLIENT_ID / PAYPAL_SECRET)');
  const r = await fetch(apiBase() + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const d = await r.json();
  if (!r.ok) throw new Error('PayPal auth failed: ' + (d.error_description || JSON.stringify(d)));
  return d.access_token;
}

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// Records a completed payment + activates subscription — mirrors api/save-payment.js exactly,
// only method='paypal'. moid is the PayPal order/subscription id (used for dedup).
async function recordPayment({ userId, email, name, plan, tid, moid, amount }) {
  if (!moid) throw new Error('moid required');
  const db = sb();

  const { data: existing } = await db.from('payments').select('id').eq('moid', moid).maybeSingle();
  if (existing) {
    if (userId) {
      try {
        await db.from('users').upsert({
          auth_id: userId, email: email || '', plan: plan || 'basic',
          plan_active: true, updated_at: new Date().toISOString()
        }, { onConflict: 'auth_id' });
      } catch (e) {}
    }
    return { alreadyRecorded: true, paymentId: existing.id };
  }

  const { data: payment, error: payErr } = await db.from('payments').insert({
    user_id: userId || ('anonymous_' + (email || moid)),
    plan: plan || '',
    amount: Math.round(parseFloat(amount) || 0), // stored as whole USD (method='paypal' denotes currency)
    method: 'paypal',
    tid: tid || '',
    moid: moid,
    status: 'completed'
  }).select().single();
  if (payErr) console.warn('[paypal] insert payment error:', payErr.message);

  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);

  if (userId) {
    try {
      await db.from('subscriptions').upsert({
        user_id: userId, plan: plan || 'basic', status: 'active',
        started_at: now.toISOString(), expires_at: expiresAt.toISOString(), updated_at: now.toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) { console.warn('[paypal] subscription upsert error:', e.message); }
    try {
      await db.from('users').upsert({
        auth_id: userId, email: email || '', plan: plan || 'basic',
        plan_active: true, updated_at: now.toISOString()
      }, { onConflict: 'auth_id' });
    } catch (e) {}
  }

  return { paymentId: payment && payment.id, expiresAt: expiresAt.toISOString() };
}

// Marks a subscription inactive (webhook cancel/expire).
async function deactivateSubscription({ userId }) {
  if (!userId) return;
  const db = sb();
  const nowIso = new Date().toISOString();
  try {
    await db.from('subscriptions').update({ status: 'cancelled', updated_at: nowIso }).eq('user_id', userId);
  } catch (e) {}
  try {
    await db.from('users').update({ plan_active: false, updated_at: nowIso }).eq('auth_id', userId);
  } catch (e) {}
}

// custom_id helper: "plan:userId" so webhooks can map an event back to a plan + user.
function packCustomId(plan, userId) { return (plan || '') + ':' + (userId || ''); }
function parseCustomId(s) {
  const i = (s || '').indexOf(':');
  if (i < 0) return { plan: '', userId: s || '' };
  return { plan: s.slice(0, i), userId: s.slice(i + 1) };
}

module.exports = {
  CURRENCY, PLANS, apiBase, getAccessToken, sb,
  recordPayment, deactivateSubscription, packCustomId, parseCustomId
};
