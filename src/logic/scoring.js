import { INITIAL_METRICS, metricsMeta, outcomeCopy, stages, weakestCopy } from '../data/scenario.js';

export const METRIC_IDS = metricsMeta.map((item) => item.id);

export function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyMetrics(current, effects) {
  const next = {};
  const applied = {};
  for (const id of METRIC_IDS) {
    const raw = current[id] + effects[id];
    next[id] = clamp(raw);
    applied[id] = next[id] - current[id];
  }
  return { next, applied };
}

export function judge(metrics) {
  const values = METRIC_IDS.map((id) => metrics[id]);
  if (values.every((value) => value >= 50)) return 'stable';
  if (values.some((value) => value < 25)) return 'crisis';
  return 'mixed';
}

export function weakestMetrics(metrics) {
  const lowest = Math.min(...METRIC_IDS.map((id) => metrics[id]));
  return metricsMeta.filter((item) => metrics[item.id] === lowest);
}

export function buildReview(metrics, history) {
  const verdict = judge(metrics);
  const weak = weakestMetrics(metrics);
  const weakNames = weak.map((item) => item.full.toLowerCase()).join(' и ');
  const lessons = [];
  const seen = new Set();

  for (const entry of history) {
    if (entry.tier === 'system' || seen.has(entry.stageId)) continue;
    const stage = stages.find((item) => item.id === entry.stageId);
    if (!stage) continue;
    seen.add(stage.id);
    lessons.push(stage.lesson);
  }

  if (lessons.length === 0) {
    lessons.push('Команда прошла все этапы так, чтобы знания, проверки и приоритеты были общими, а не личными.');
    lessons.push('Запас времени всё равно уменьшился: ясные договорённости и проверка стоят дней сейчас и спасают недели потом.');
  }

  return {
    verdict,
    title: outcomeCopy[verdict].title,
    text: outcomeCopy[verdict].text,
    weakestLine: `Слабое место — ${weakNames}. ${weak.map((item) => weakestCopy[item.id]).join(' ')}`,
    lessons: lessons.slice(0, 3),
    fromStart: Object.fromEntries(
      METRIC_IDS.map((id) => [id, metrics[id] - INITIAL_METRICS[id]]),
    ),
  };
}
