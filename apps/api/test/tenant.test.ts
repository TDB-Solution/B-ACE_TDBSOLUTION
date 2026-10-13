import assert from 'node:assert/strict';
import test from 'node:test';
import { priceQuote } from '@bace/shared';
import { scope } from '../src/common/auth';

test('priceQuote applies margin and manual override', () => {
  const priced = priceQuote({
    workingDays: 10,
    freelancers: 2,
    freelanceRate: 1_000_000,
    vpsDomain: 1_000_000,
    buffer: 0,
    commissionRate: 10,
    entertainmentRate: 0,
    otherRate: 0,
    profitMargin: 50,
  });
  assert.equal(priced.personnelCost, 20_000_000);
  assert.equal(priced.sellingPrice, priced.totalCost * 1.5);

  const manual = priceQuote({
    workingDays: 10,
    freelancers: 1,
    freelanceRate: 1_000_000,
    vpsDomain: 0,
    buffer: 0,
    commissionRate: 0,
    entertainmentRate: 0,
    otherRate: 0,
    profitMargin: 50,
    manualPrice: 12_000_000,
  });
  assert.equal(manual.sellingPrice, 12_000_000);
});

test('scope refuses a query without tenant_id', () => {
  assert.throws(() => scope(''), /TENANT_ID_REQUIRED/);
  assert.deepEqual(scope('tenant-1', { status: 'lead' }), {
    status: 'lead',
    tenantId: 'tenant-1',
  });
});
