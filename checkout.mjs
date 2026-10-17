import Stripe from 'stripe';
import { catalog, parseCart, json } from './catalog.mjs';

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const liveFlag = Netlify.env.get('STORE_OPEN');
  if (liveFlag !== 'true') return json({ error: 'Checkout is not open yet. The shop owner is finishing setup.' }, 503);
  const key = Netlify.env.get('STRIPE_SECRET_KEY');
  const shipping = Netlify.env.get('STRIPE_SHIPPING_RATE_ID');
  if (!key || !shipping || !key.startsWith('sk_live_')) return json({ error: 'Checkout setup is incomplete. Please try again later.' }, 503);
  try {
    const { items } = await request.json();
    const cart = parseCart(items);
    // IMPORTANT: amounts and labels come from the server, not from the browser.
    const stripe = new Stripe(key);
    // Refuse purchases once the known stock is sold. For a busy store, replace this
    // with inventory reservations in a transactional database before scaling.
    const sold = Object.fromEntries(Object.keys(catalog).map(id => [id, 0]));
    let cursor;
    for (let page = 0; page < 10; page++) {
      const results = await stripe.checkout.sessions.list({ limit: 100, status: 'complete', ...(cursor ? { starting_after: cursor } : {}) });
      for (const paid of results.data) {
        if (!paid.livemode || paid.payment_status !== 'paid') continue;
        let contents = [];
        try { contents = JSON.parse(paid.metadata?.cart || '[]'); } catch {}
        for (const item of contents) if (Object.hasOwn(sold, item.id) && Number.isSafeInteger(item.quantity)) sold[item.id] += item.quantity;
      }
      if (!results.has_more || !results.data.length) break;
      cursor = results.data.at(-1).id;
    }
    if (cart.some(({ id, quantity, product }) => sold[id] + quantity > product.max)) {
      return json({ error: 'A color in your bag has sold out. Please check with the store before placing an order.' }, 409);
    }
    // Stripe payment completion requires a separate webhook or dashboard reconciliation
    // for fulfillment. Success redirects alone are not proof of a paid order.
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: cart.map(({ product, quantity }) => ({
        price_data: {
          currency: 'usd',
          unit_amount: product.cents,
          product_data: { name: product.name }
        },
        quantity
      })),
      metadata: { cart: JSON.stringify(cart.map(({ id, quantity }) => ({ id, quantity }))) },
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [{ shipping_rate: shipping }],
      billing_address_collection: 'auto',
      ...(Netlify.env.get('STRIPE_AUTOMATIC_TAX') === 'true' ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`
    });
    if (!session.url) return json({ error: 'Unable to open secure checkout right now.' }, 502);
    return json({ url: session.url });
  } catch (err) {
    if (err?.message?.startsWith('Please') || err?.message?.includes('invalid')) return json({ error: err.message }, 400);
    console.error('Checkout could not be created:', err?.type ?? 'error');
    return json({ error: 'Checkout is temporarily unavailable. Please contact the shop owner.' }, 503);
  }
}
