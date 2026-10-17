import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, parseCart } from '../netlify/functions/catalog.mjs';

test('all six squishy SKUs have positive, sensible draft prices', () => {
  assert.equal(Object.keys(catalog).length, 6);
  for (const [id, item] of Object.entries(catalog)) {
    assert.ok(id && item.name);
    assert.ok(Number.isInteger(item.cents) && item.cents >= 700 && item.cents <= 1000);
    assert.equal(item.max, 2);
  }
});
test('valid cart quantities and server-side price authority', () => {
  const order = parseCart([{id:'blue-soap', quantity:2}, {id:'pearl-oil',quantity:1}]);
  assert.equal(order.length, 2);
  assert.equal(order[0].product.cents, 899);
});
test('invalid cart structures rejected', () => {
  for(const bad of [[], [{id:'invalid',quantity:1}], [{id:'blue-soap',quantity:5}], [{id:'blue-soap',quantity:-1}], [{id:'pink-soap',quantity:1},{id:'pink-soap',quantity:1}], [{id:'clear-oil',quantity:1.5}]]) {
    assert.throws(() => parseCart(bad));
  }
});
