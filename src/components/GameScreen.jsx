import { useEffect, useRef } from 'react';
import { INITIAL_METRICS, metricsMeta, outcomeCopy, project, roles, stages, tierMeta } from '../data/scenario.js';
import { judge, weakestMetrics } from '../logic/scoring.js';
import { Metrics } from './Metrics.jsx';

function roleOf(id) {
  return roles.find((role) => role.id === id);
}

function mark(role) {
  const custom = {
    pm: 'Мн',
    design: 'Ди',
    architect: 'Ар',
    dev: 'Рз',
    qa: 'Пр',
    devops: 'Вп',
    support: 'Пд',
  };
  return custom[role?.id] || '';
}

function StageProgress({ stageIndex, mode = 'full' }) {
  return (
    <ol className={`stage-list stage-list--${mode}`}>
      {stages.map((stage, index) => {
        const state = index === stageIndex ? 'is-current' : index < stageIndex ? 'is-done' : '';
        return (
          <li key={stage.id} className={state} aria-current={index === stageIndex ? 'step' : undefined}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {' '}
            <span>{stage.short}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function GameScreen({ session, alarm, onSelect, onConfirm, onAdvance, onLayout }) {
  const stage = stages[session.stageIndex];
  const speaker = roleOf(stage.speaker.roleId);
  const order = session.order[stage.id] || stage.options.map((option) => option.id);
  const options = order.map((id) => stage.options.find((option) => option.id === id)).filter(Boolean);
  const locked = session.phase === 'outcome';
  const chosen = stage.options.find((option) => option.id === session.selectedId) || null;
  const entry = session.history.find((item) => item.stageId === stage.id);
  const titleRef = useRef(null);
  const outcomeRef = useRef(null);
  const optionRefs = useRef({});
  const last = session.stageIndex === stages.length - 1;
  const isHq = session.layout === 'hq';
  const isCard = session.layout === 'card';
  const stageNo = session.stageIndex + 1;

  useEffect(() => {
    if (!locked) titleRef.current?.focus();
  }, [session.stageIndex, locked]);

  useEffect(() => {
    if (locked && !alarm) outcomeRef.current?.focus();
  }, [locked, alarm, session.stageIndex]);

  function move(step) {
    if (locked) return;
    const current = options.findIndex((option) => option.id === session.selectedId);
    const nextIndex = current < 0
      ? (step > 0 ? 0 : options.length - 1)
      : (current + step + options.length) % options.length;
    const next = options[nextIndex];
    onSelect(next.id);
    optionRefs.current[next.id]?.focus();
  }

  function onGroupKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    }
  }

  const teamList = (
    <div className="team-block">
      <p>{locked ? 'Затронутые роли' : 'Команда'}</p>
      <ul>
        {roles.map((role) => {
          const hit = locked && chosen?.affects.includes(role.id);
          return (
            <li key={role.id} className={hit ? 'is-hit' : locked ? 'is-quiet' : ''}>
              {role.short}
              {hit && <span className="sr-only">, роль затронута</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const metricsBlock = (
    <div className="metrics-wrap" aria-live="polite">
      <Metrics metrics={session.metrics} deltas={locked ? entry?.applied : null} />
    </div>
  );

  const story = (
    <section className="story" aria-labelledby="stage-title">
      <h1 id="stage-title" tabIndex={-1} ref={titleRef}>{stage.title}</h1>
      <p className="lede">{stage.lead}</p>
      {stage.terms?.length > 0 && (
        <dl className="terms">
          {stage.terms.map((term) => (
            <div key={term.term}>
              <dt>{term.term}</dt>
              <dd>{term.text}</dd>
            </div>
          ))}
        </dl>
      )}

      <article className="message">
        <header>
          <span className="avatar" aria-hidden="true">{mark(speaker)}</span>
          <span>
            <strong>{speaker?.name}</strong>
            <small>{stage.speaker.eyebrow}</small>
          </span>
          <span className="badge">Есть риск</span>
        </header>
        <blockquote>«{stage.speaker.quote}»</blockquote>
      </article>
    </section>
  );

  const choices = (
    <form
      className="choices"
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked) onConfirm();
      }}
    >
      <div className="choices__head">
        <h2>Как вы поступите?</h2>
      </div>
      <div
        className="options options--grid"
        role="radiogroup"
        aria-label="Как вы поступите?"
        onKeyDown={onGroupKeyDown}
      >
        {options.map((option, index) => {
          const selected = option.id === session.selectedId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              ref={(node) => {
                optionRefs.current[option.id] = node;
              }}
              tabIndex={selected || (!session.selectedId && index === 0) ? 0 : -1}
              className={`option ${selected ? 'is-selected' : ''} ${locked && !selected ? 'is-muted' : ''}`}
              onClick={() => onSelect(option.id)}
            >
              <span className="radio" aria-hidden="true" />
              <span>
                <strong>{option.title}</strong>
                <small>{option.text}</small>
              </span>
            </button>
          );
        })}
      </div>
      {!locked && (
        <div className="decision-row">
          <button type="submit" className="button" disabled={!session.selectedId}>
            Принять решение →
          </button>
        </div>
      )}
    </form>
  );

  const outcome = locked && chosen && entry && (
    <section className="outcome">
      <div className="outcome-copy" aria-label="Последствия решения" tabIndex={-1} ref={outcomeRef}>
        <div className={`banner banner--${chosen.tier}`}>
          <strong>{tierMeta[chosen.tier].banner}</strong>
          <p>{chosen.tier === 'system' ? chosen.consequenceTitle : chosen.scare}</p>
          <p className="tier-line">{tierMeta[chosen.tier].label}</p>
        </div>
        {chosen.tier !== 'system' && <h3>{chosen.consequenceTitle}</h3>}
        <p>{chosen.consequence}</p>
        <p className="anti">
          <span>Антипаттерн этапа</span>
          {stage.antipattern}. {stage.antipatternHint}
        </p>
        <h3 className="reactions-head">Что говорит команда</h3>
        <ul className="reactions">
          {chosen.reactions.map((reaction) => {
            const role = roleOf(reaction.roleId);
            return (
              <li key={reaction.roleId}>
                <span className="avatar" aria-hidden="true">{mark(role)}</span>
                <span>
                  <strong>{role?.name}</strong>
                  <small>{reaction.text}</small>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="outcome-facts">
        <h3>Что произошло с показателями</h3>
        <ul className="effect-list">
          {metricsMeta.map((meta) => {
            const delta = entry.applied[meta.id];
            const word = delta > 0 ? 'выросло' : delta < 0 ? 'упало' : 'без изменений';
            const signed = delta > 0 ? `+${delta}` : `${delta}`;
            return (
              <li key={meta.id}>
                <strong>{meta.full}</strong>
                <em className={delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}>
                  {delta === 0 ? word : `${signed}, ${word}`}
                </em>
                <span>{chosen.effectNotes[meta.id]}</span>
              </li>
            );
          })}
        </ul>
        <aside className="lesson">
          <p className="eyebrow">Вывод этапа</p>
          <p>{stage.lesson}</p>
        </aside>
        {chosen.tier !== 'system' && (
          <p className="keep-going">Игра продолжается — впереди остальные этапы.</p>
        )}
      </div>
    </section>
  );

  const verdict = judge(session.metrics);
  const weak = weakestMetrics(session.metrics);
  const fromStart = Object.fromEntries(
    metricsMeta.map((meta) => [meta.id, session.metrics[meta.id] - INITIAL_METRICS[meta.id]]),
  );
  const roleLoad = roles.map((role) => {
    let rough = 0;
    let steady = 0;
    for (const item of session.history) {
      const past = stages.find((s) => s.id === item.stageId)?.options.find((o) => o.id === item.optionId);
      if (!past?.affects.includes(role.id)) continue;
      if (past.tier === 'system') steady += 1;
      else rough += 1;
    }
    return { role, rough, steady };
  });

  const hqView = (
    <div className="hq">
      <div className="hq__head">
        <div>
          <p className="eyebrow">Штаб проекта · {project.name}</p>
          <h1 id="stage-title" tabIndex={-1} ref={titleRef}>
            Состояние проекта на этапе {stageNo} из {stages.length}
          </h1>
        </div>
        <button type="button" className="button button--ghost" onClick={() => onLayout('card')}>
          {locked ? 'К карточке миссии' : 'Вернуться к решению →'}
        </button>
      </div>

      <section className="hq-panel" aria-labelledby="hq-metrics">
        <h2 id="hq-metrics">Показатели с начала проекта</h2>
        <Metrics metrics={session.metrics} deltas={fromStart} mode="total" />
      </section>

      <div className="hq-grid">
        <section className={`hq-panel hq-forecast hq-forecast--${verdict}`} aria-labelledby="hq-forecast">
          <h2 id="hq-forecast">Если выпустить сейчас</h2>
          <p className="hq-forecast__title">{outcomeCopy[verdict].title}</p>
          <p>
            Слабее всего: {weak.map((item) => `${item.full.toLowerCase()} (${session.metrics[item.id]})`).join(', ')}.
          </p>
        </section>

        <section className="hq-panel" aria-labelledby="hq-current">
          <h2 id="hq-current">Текущий этап</h2>
          <p className="hq-current__stage">{stageNo}. {stage.short}</p>
          <p>{stage.title}</p>
          <p className={`hq-status ${locked && chosen ? `hq-status--${chosen.tier}` : ''}`}>
            {locked && chosen
              ? `Решение: ${chosen.title} — ${tierMeta[chosen.tier].label.toLowerCase()}`
              : 'Решение ещё не принято'}
          </p>
        </section>
      </div>

      <section className="hq-panel" aria-labelledby="hq-history">
        <h2 id="hq-history">Решения по этапам</h2>
        <ol className="hq-history">
          {stages.map((item, index) => {
            const done = session.history.find((h) => h.stageId === item.id);
            const option = done && item.options.find((o) => o.id === done.optionId);
            const state = option ? `is-${option.tier}` : index === session.stageIndex ? 'is-current' : 'is-ahead';
            return (
              <li key={item.id} className={state}>
                <span className="hq-history__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="hq-history__body">
                  <strong>{item.short}</strong>
                  <small>
                    {option
                      ? `${option.title} · ${tierMeta[option.tier].label}`
                      : index === session.stageIndex
                        ? 'Сейчас: решение в карточке миссии'
                        : 'Впереди'}
                  </small>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="hq-panel" aria-labelledby="hq-team">
        <h2 id="hq-team">Нагрузка на команду</h2>
        <ul className="hq-team">
          {roleLoad.map(({ role, rough, steady }) => (
            <li key={role.id} className={rough >= 2 ? 'is-strained' : ''}>
              <strong>{role.name}</strong>
              <small>
                {rough === 0 && steady === 0
                  ? 'Пока не затронут'
                  : `Неудачных ходов: ${rough} · верных: ${steady}`}
              </small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <div className={`workspace is-${session.layout} ${locked ? 'is-locked' : ''}`}>
      {isHq && (
        <aside className="sidebar">
          <p className="eyebrow">Жизненный цикл</p>
          <StageProgress stageIndex={session.stageIndex} mode="stack" />
          <div className="project-card">
            <p className="eyebrow">Ваш проект</p>
            <h2>{project.name}</h2>
            <p>{project.summary}</p>
            <p className="code">{project.code}</p>
            <p>{project.specialtyShort}</p>
          </div>
        </aside>
      )}

      <div className="board">
        {isCard && (
          <div className="mission-bar">
            <div>
              <p className="eyebrow">Карточка миссии</p>
              <p className="mission-bar__title">
                Этап {stageNo}: {stage.short}
              </p>
            </div>
          </div>
        )}

        <div className={`stage-tabs ${isHq ? 'stage-tabs--mobile' : ''}`} aria-label="Этапы">
          <StageProgress stageIndex={session.stageIndex} mode="tabs" />
        </div>

        {isCard && (
          <>
            <div className="play play--mission">
              {story}
              <div className="play-main">
                {choices}
                {outcome}
              </div>
            </div>
            {metricsBlock}
          </>
        )}

        {isHq && hqView}

        <footer className="board-foot">
          {isCard && teamList}
          <div className="board-foot__end">
            {locked && chosen && (
              <button type="button" className="button" onClick={onAdvance} disabled={Boolean(alarm)}>
                {last ? 'Посмотреть итог →' : 'Следующий этап →'}
              </button>
            )}
            <div className="pager" role="group" aria-label="Вид экрана">
              <button
                type="button"
                onClick={() => onLayout(isHq ? 'card' : 'hq')}
                aria-label={isHq ? 'Открыть карточку миссии' : 'Открыть штаб проекта'}
              >
                ‹
              </button>
              <span>
                {isCard
                  ? '1 / 2 · Карточка: одна миссия'
                  : '2 / 2 · Штаб: весь проект'}
              </span>
              <button
                type="button"
                onClick={() => onLayout(isHq ? 'card' : 'hq')}
                aria-label={isHq ? 'Открыть карточку миссии' : 'Открыть штаб проекта'}
              >
                ›
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
