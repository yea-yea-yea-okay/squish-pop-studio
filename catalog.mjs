// Single server-side source of truth for available SKUs and the draft prices.
// Update these figures and the public catalog together before enabling payment.
export const catalog = Object.freeze({
  'blue-soap': { name: 'Crunchy Soap Squishy — Blue', cents: 899, max: 2 },
  'pink-soap': { name: 'Crunchy Soap Squishy — Pink', cents: 899, max: 2 },
  'white-soap': { name: 'Crunchy Soap Squishy — White', cents: 899, max: 2 },
  'pink-green-sand': { name: 'Two-Tone Crunchy Sand Ball', cents: 949, max: 2 },
  'clear-oil': { name: 'Crystal Clear Rebound Squishy', cents: 799, max: 2 },
  'pearl-oil': { name: 'Pearl Coconut Oil Squishy', cents: 849, max: 2 }
});

export function parseCart(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 6) throw new Error('Please add products to your cart.');
  const seen = new Set();
  return raw.map(item => {
    const id = String(item?.id ?? '');
    const quantity = Number(item?.quantity);
    const product = catalog[id];
    if (!product || seen.has(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.max) {
      throw new Error('One or more cart items are invalid. Please update your cart.');
    }
    seen.add(id);
    return { id, quantity, product };
  });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
