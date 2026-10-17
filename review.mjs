import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { catalog, json } from './catalog.mjs';

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = Netlify.env.get('STRIPE_SECRET_KEY');
  if (!key) return json({ error: 'Reviews are not enabled yet.' }, 503);
  try {
    const input = await request.json();
    const sessionId = String(input.sessionId || '');
    const id = String(input.id || '');
    const rating = Number(input.rating);
    const name = String(input.name || 'Customer').trim().slice(0, 26).replace(/[<>]/g, '');
    const reviewText = String(input.text || '').trim().slice(0, 450).replace(/[<>]/g, '');
    if (!/^cs_(test_)?[A-Za-z0-9]+$/.test(sessionId) || !catalog[id] || !Number.isSafeInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10) {
      return json({ error: 'Please enter a valid rating and review of at least 10 characters.' }, 400);
    }
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const purchased = JSON.parse(session.metadata?.cart || '[]');
    if (!session.livemode || session.payment_status !== 'paid' || !purchased.some(item => item.id === id)) return json({ error: 'Verified purchasers can review this item.' }, 403);
    const store = getStore({ name: 'squish-pop-reviews', consistency: 'strong' });
    const entry = { id, rating, name: name || 'Customer', text: reviewText, date: new Date().toISOString().slice(0, 10) };
    // Saved as pending so the parent can check inappropriate content before publishing.
    const saved = await store.setJSON(`pending/${sessionId}/${id}`, entry, { onlyIfNew: true });
    if (!saved.modified) return json({ error: 'A review for this item was already submitted.' }, 409);
    return json({ message: 'Thanks! Your review was submitted for moderation.' });
  } catch { return json({ error: 'Review submission is temporarily unavailable.' }, 503); }
}
