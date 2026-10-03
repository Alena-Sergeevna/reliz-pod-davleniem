import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_METRICS, stages } from '../data/scenario.js';
import { createOrder } from './order.js';
import { applyMetrics, judge } from './scoring.js';
import { loadSave } from './storage.js';

function play(tier) {
  let metrics = { ...INITIAL_METRICS };
  for (const stage of stages) {
    const option = stage.options.find((item) => item.tier === tier);
    metrics = applyMetrics(metrics, option.effects).next;
  }
  return metrics;
}

test('системный путь даёт устойчивый релиз', () => {
  const metrics = play('system');
  assert.equal(judge(metrics), 'stable');
  for (const value of Object.values(metrics)) {
    assert.ok(value >= 50 && value <= 100);
  }
});

test('частичный путь даёт релиз с последствиями', () => {
  const metrics = play('partial');
  assert.equal(judge(metrics), 'mixed');
  for (const value of Object.values(metrics)) {
    assert.ok(value >= 25 && value <= 100);
    assert.ok(Object.values(metrics).some((item) => item < 50));
  }
});

test('рискованный путь приводит проект к кризису', () => {
  const metrics = play('risk');
  assert.equal(judge(metrics), 'crisis');
  assert.ok(Object.values(metrics).some((value) => value < 25));
  for (const value of Object.values(metrics)) assert.ok(value >= 0 && value <= 100);
});

test('границы итога совпадают с правилами', () => {
  assert.equal(judge({ time: 50, quality: 50, team: 50, trust: 50 }), 'stable');
  assert.equal(judge({ time: 49, quality: 80, team: 80, trust: 80 }), 'mixed');
  assert.equal(judge({ time: 25, quality: 40, team: 80, trust: 80 }), 'mixed');
  assert.equal(judge({ time: 24, quality: 90, team: 90, trust: 90 }), 'crisis');
  assert.equal(judge({ time: 100, quality: 100, team: 100, trust: 10 }), 'crisis');
});

test('показатели не выходят за 0–100', () => {
  const high = applyMetrics({ time: 98, quality: 2, team: 0, trust: 100 }, {
    time: 10,
    quality: -10,
    team: -5,
    trust: 5,
  });
  assert.deepEqual(high.next, { time: 100, quality: 0, team: 0, trust: 100 });
  assert.deepEqual(high.applied, { time: 2, quality: -2, team: 0, trust: 0 });
});

test('порядок вариантов стабилен и полон', () => {
  const first = createOrder(42, stages);
  const second = createOrder(42, stages);
  assert.deepEqual(first, second);
  for (const stage of stages) {
    assert.deepEqual([...first[stage.id]].sort(), stage.options.map((option) => option.id).sort());
  }
});

test('без localStorage сохранение не ломает игру', () => {
  assert.equal(loadSave(), null);
});
