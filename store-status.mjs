import { json } from './catalog.mjs';

// Public, non-sensitive launch status; never expose credentials.
export default async function handler(request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const checkoutConfigured = !!(Netlify.env.get('STRIPE_SECRET_KEY') && Netlify.env.get('STRIPE_SHIPPING_RATE_ID'));
  const ready = checkoutConfigured && Netlify.env.get('STORE_OPEN') === 'true';
  return json({ acceptingOrders: ready });
}
