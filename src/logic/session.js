import { INITIAL_METRICS, SCENARIO_VERSION, stages } from '../data/scenario.js';
import { createOrder } from './order.js';

export function createSession() {
  const gameId = Math.floor(Math.random() * 0x7fffffff);
  return {
    scenarioVersion: SCENARIO_VERSION,
    gameId,
    screen: 'briefing',
    stageIndex: 0,
    metrics: { ...INITIAL_METRICS },
    order: createOrder(gameId, stages),
    selectedId: null,
    phase: 'choose',
    history: [],
    layout: 'card',
  };
}
