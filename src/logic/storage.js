import { SCENARIO_VERSION, stages } from '../data/scenario.js';
import { METRIC_IDS, replayHistory } from './scoring.js';

export const SAVE_KEY = 'rup-save-v1';
export const MUTE_KEY = 'rup-muted';

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSave() {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return null;
    return sanitizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSave(session) {
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    storage()?.removeItem(SAVE_KEY);
  } catch {
    /* Игра продолжается без хранения. */
  }
}

export function loadMuted() {
  try {
    return storage()?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeMuted(muted) {
  try {
    storage()?.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* Настройка звука останется только до закрытия вкладки. */
  }
}

export function sanitizeSave(data) {
  if (!data || data.scenarioVersion !== SCENARIO_VERSION) return null;
  if (!['briefing', 'stage', 'result'].includes(data.screen)) return null;
  if (!data.metrics) return null;
  for (const id of METRIC_IDS) {
    if (typeof data.metrics[id] !== 'number' || Number.isNaN(data.metrics[id])) return null;
  }

  const replayed = replayHistory(Array.isArray(data.history) ? data.history : []);
  const metrics = replayed.metrics;
  const history = replayed.history;

  let stageIndex = history.length;
  if (data.screen === 'stage' && data.phase === 'outcome' && history.length > 0) {
    const last = history[history.length - 1];
    stageIndex = Math.max(0, stages.findIndex((stage) => stage.id === last.stageId));
  }
  if (stageIndex >= stages.length) stageIndex = stages.length - 1;

  const order = {};
  for (const stage of stages) {
    const ids = stage.options.map((option) => option.id);
    const given = Array.isArray(data.order?.[stage.id]) ? data.order[stage.id] : [];
    const unique = new Set(given);
    if (given.length === ids.length && ids.every((id) => unique.has(id))) order[stage.id] = given;
    else order[stage.id] = ids;
  }

  const stage = stages[stageIndex];
  let selectedId = data.selectedId ?? null;
  if (selectedId && !stage.options.some((option) => option.id === selectedId)) selectedId = null;

  let phase = data.phase === 'outcome' ? 'outcome' : 'choose';
  if (data.screen === 'stage' && phase === 'outcome') {
    const recorded = history.find((entry) => entry.stageId === stage.id);
    if (!recorded) phase = 'choose';
    else selectedId = recorded.optionId;
  }

  return {
    scenarioVersion: SCENARIO_VERSION,
    gameId: typeof data.gameId === 'number' ? data.gameId : 1,
    screen: data.screen,
    stageIndex,
    metrics,
    order,
    selectedId: phase === 'choose' && data.screen !== 'result' ? selectedId : selectedId,
    phase: data.screen === 'stage' ? phase : 'choose',
    history,
    layout: data.layout === 'hq' ? 'hq' : 'card',
  };
}
