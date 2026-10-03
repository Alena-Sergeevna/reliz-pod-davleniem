import { useEffect, useRef, useState } from 'react';
import { stages } from './data/scenario.js';
import { motionAllowed, playAlarm, playClear } from './logic/audio.js';
import { applyMetrics } from './logic/scoring.js';
import { createSession } from './logic/session.js';
import { clearSave, loadMuted, loadSave, writeMuted, writeSave } from './logic/storage.js';
import { BriefingScreen } from './components/BriefingScreen.jsx';
import { GameScreen } from './components/GameScreen.jsx';
import { Header } from './components/Header.jsx';
import { ResultScreen } from './components/ResultScreen.jsx';
import { ScareOverlay } from './components/ScareOverlay.jsx';
import { StartScreen } from './components/StartScreen.jsx';

export function App() {
  const [ready, setReady] = useState(false);
  const [resume, setResume] = useState(null);
  const [session, setSession] = useState(null);
  const [muted, setMuted] = useState(false);
  const [saveOk, setSaveOk] = useState(true);
  const [alarm, setAlarm] = useState(null);
  const confirming = useRef(false);

  useEffect(() => {
    setResume(loadSave());
    setMuted(loadMuted());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !session) return;
    setSaveOk(writeSave(session));
  }, [ready, session]);

  useEffect(() => {
    if (!alarm) return undefined;
    const delay = alarm.tier === 'risk' ? 5200 : 4200;
    const timer = window.setTimeout(() => setAlarm(null), delay);
    return () => window.clearTimeout(timer);
  }, [alarm]);

  useEffect(() => {
    document.body.classList.toggle('is-alarm', Boolean(alarm));
    return () => document.body.classList.remove('is-alarm');
  }, [alarm]);

  useEffect(() => {
    if (!session) {
      document.title = 'Релиз под давлением';
      return;
    }
    if (session.screen === 'briefing') document.title = 'Релиз под давлением — проект';
    else if (session.screen === 'result') document.title = 'Релиз под давлением — итог';
    else document.title = `Релиз под давлением — ${stages[session.stageIndex].short}`;
  }, [session]);

  function toggleMute() {
    setMuted((value) => {
      writeMuted(!value);
      return !value;
    });
  }

  function startNew() {
    confirming.current = false;
    setAlarm(null);
    setResume(null);
    setSession(createSession());
  }

  function continueGame() {
    if (!resume) return;
    confirming.current = false;
    setAlarm(null);
    setSession(resume);
  }

  function replay() {
    clearSave();
    setAlarm(null);
    setSession(null);
    setResume(null);
  }

  function selectOption(optionId) {
    setSession((current) => {
      if (!current || current.phase !== 'choose') return current;
      return { ...current, selectedId: optionId };
    });
  }

  function confirmChoice() {
    if (confirming.current || !session || session.screen !== 'stage' || session.phase !== 'choose' || !session.selectedId) {
      return;
    }
    const stage = stages[session.stageIndex];
    if (session.history.some((entry) => entry.stageId === stage.id)) return;
    const option = stage.options.find((item) => item.id === session.selectedId);
    if (!option) return;
    const { next, applied } = applyMetrics(session.metrics, option.effects);
    confirming.current = true;
    setSession({
      ...session,
      metrics: next,
      phase: 'outcome',
      history: [
        ...session.history,
        {
          stageId: stage.id,
          optionId: option.id,
          tier: option.tier,
          applied,
        },
      ],
    });
    if (option.tier === 'system') {
      if (!muted) playClear();
      return;
    }
    if (!motionAllowed()) return;
    setAlarm({ tier: option.tier, line: option.scare, token: Date.now() });
    if (!muted) playAlarm(option.tier);
    if (option.tier === 'risk' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([28, 40, 70]);
      } catch {
        /* Вибрация необязательна. */
      }
    }
  }

  function advance() {
    confirming.current = false;
    setAlarm(null);
    setSession((current) => {
      if (!current || current.phase !== 'outcome') return current;
      if (current.stageIndex >= stages.length - 1) {
        return { ...current, screen: 'result', phase: 'choose', selectedId: null };
      }
      return {
        ...current,
        stageIndex: current.stageIndex + 1,
        phase: 'choose',
        selectedId: null,
      };
    });
  }

  function setLayout(layout) {
    setSession((current) => (current ? { ...current, layout } : current));
  }

  return (
    <>
      <div className={`app ${alarm ? `is-shaking is-${alarm.tier}` : ''}`} inert={alarm ? true : undefined}>
        <Header muted={muted} onToggleMute={toggleMute} />
        {!ready && <p className="booting">Загрузка…</p>}
        {ready && !session && (
          <StartScreen resume={resume} onStart={startNew} onContinue={continueGame} />
        )}
        {session?.screen === 'briefing' && (
          <BriefingScreen onNext={() => setSession((current) => ({ ...current, screen: 'stage' }))} />
        )}
        {session?.screen === 'stage' && (
          <GameScreen
            session={session}
            alarm={alarm}
            onSelect={selectOption}
            onConfirm={confirmChoice}
            onAdvance={advance}
            onLayout={setLayout}
          />
        )}
        {session?.screen === 'result' && <ResultScreen session={session} onReplay={replay} />}
        {session && !saveOk && (
          <p className="save-note" role="status">
            В этом браузере прогресс не сохранится. Игру всё равно можно пройти до конца.
          </p>
        )}
      </div>
      {alarm && <ScareOverlay tier={alarm.tier} line={alarm.line} />}
    </>
  );
}
