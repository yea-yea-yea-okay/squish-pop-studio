import Stripe from 'stripe';
import { catalog, json } from './catalog.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !/^cs_(test_)?[A-Za-z0-9]+$/.test(sessionId)) return json({ error: 'Invalid order identifier.' }, 400);
  const key = Netlify.env.get('STRIPE_SECRET_KEY');
  if (!key) return json({ error: 'Payment verification is not configured.' }, 503);
  try {
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return json({ paid: false, products: [] });
    const items = JSON.parse(session.metadata?.cart || '[]');
    return json({ paid: true, products: items.filter(item => catalog[item.id]).map(item => ({ id: item.id, name: catalog[item.id].name })) });
  } catch { return json({ error: 'Unable to verify this order.' }, 404); }
}
