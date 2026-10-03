import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_METRICS, SCENARIO_VERSION, stages } from '../data/scenario.js';
import { createOrder } from './order.js';
import { applyMetrics, judge, replayHistory } from './scoring.js';
import { loadSave, sanitizeSave } from './storage.js';

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

test('повтор хода не удваивает баллы', () => {
  const history = stages.map((stage) => {
    const option = stage.options.find((item) => item.tier === 'risk');
    return {
      stageId: stage.id,
      optionId: option.id,
      tier: option.tier,
      applied: { time: 50, quality: 50, team: 50, trust: 50 },
    };
  });
  history.push({ ...history[0] });
  assert.deepEqual(replayHistory(history).metrics, play('risk'));
});

test('битое сохранение пересчитывается по решениям', () => {
  const history = stages.map((stage) => {
    const option = stage.options.find((item) => item.tier === 'system');
    return { stageId: stage.id, optionId: option.id, tier: option.tier, applied: { time: 9, quality: 9, team: 9, trust: 9 } };
  });
  const saved = sanitizeSave({
    scenarioVersion: SCENARIO_VERSION,
    screen: 'result',
    phase: 'choose',
    stageIndex: 0,
    gameId: 7,
    metrics: { time: 1, quality: 1, team: 1, trust: 1 },
    history,
    order: {},
  });
  assert.deepEqual(saved.metrics, play('system'));
});

test('строковые баллы не склеиваются в сотни', () => {
  const next = applyMetrics(
    { time: '70', quality: 70, team: 70, trust: 70 },
    { time: 5, quality: -12, team: -6, trust: -10 },
  );
  assert.deepEqual(next.next, { time: 75, quality: 58, team: 64, trust: 60 });
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
