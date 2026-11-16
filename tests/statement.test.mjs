import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDemo } from '../src/domain/demo.ts';
import { activity, cashLedger, money, today } from '../src/domain/ledger.ts';
import { statementHtml } from '../src/domain/statement-html.ts';
test('filtered cash statements retain full-period closing balances', () => {
  const data = createDemo(),
    period = today().slice(0, 7);
  const first = activity(data, period)[0];
  const html = statementHtml(data, period, 'IDR', 'Transactions', { activity: [first] }, true);
  assert.ok(html.includes('DEMO DATA'));
  assert.ok(html.includes('Filtered line items'));
  assert.ok(html.includes(money(cashLedger(data, period, 'IDR').end)));
  assert.ok(html.includes(first.title));
  assert.ok(!html.includes('Monthly salary'));
});
test('PDF markup escapes user-controlled descriptions and notes', () => {
  const data = createDemo();
  data.transactions[0].description = '<img src=x onerror=alert(1)> & "salary"';
  const html = statementHtml(data, today().slice(0, 7), 'IDR', 'Overview');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x'));
});
test('investment statements exclude unrelated cash activity', () => {
  const html = statementHtml(createDemo(), today().slice(0, 7), 'IDR', 'Investments');
  assert.ok(html.includes('Investment holdings'));
  assert.ok(html.includes('Index fund contribution'));
  assert.ok(!html.includes('Apartment rent'));
});
