import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { catalog, json } from './catalog.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const counts = Object.fromEntries(Object.keys(catalog).map(id => [id, 0]));
  const reviews = [];
  let status = 'unavailable';
  const key = Netlify.env.get('STRIPE_SECRET_KEY');
  if (key) {
    try {
      const stripe = new Stripe(key);
      // Count completed, paid Stripe Checkout Sessions, not visits/carts/tests.
      // Assortment is very small; paginate carefully and cap result traversal.
      let cursor;
      for (let page = 0; page < 10; page++) {
        const r = await stripe.checkout.sessions.list({ limit: 100, status: 'complete', ...(cursor ? { starting_after: cursor } : {}) });
        for (const session of r.data) {
          if (!session.livemode || session.payment_status !== 'paid' || !session.metadata?.cart) continue;
          let items;
          try { items = JSON.parse(session.metadata.cart); } catch { continue; }
          for (const item of items) if (Object.hasOwn(counts, item.id) && Number.isInteger(item.quantity)) counts[item.id] += item.quantity;
        }
        if (!r.has_more || !r.data.length) break;
        cursor = r.data[r.data.length - 1].id;
      }
      status = stripe.secretKey?.startsWith('sk_live_') ? 'live' : 'test';
    } catch { status = 'unavailable'; }
  }
  try {
    const store = getStore({ name: 'squish-pop-reviews', consistency: 'strong' });
    const { blobs } = await store.list({ prefix: 'published/' });
    for (const blob of blobs.slice(0, 200)) {
      const item = await store.get(blob.key, { type: 'json' });
      if (item && catalog[item.id]) reviews.push({ id: item.id, rating: item.rating, text: item.text, name: item.name, date: item.date });
    }
  } catch { /* review feed is optional while store is being set up */ }
  return json({ counts, reviews, status });
}
