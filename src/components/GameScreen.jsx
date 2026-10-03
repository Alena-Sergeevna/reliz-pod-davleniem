import { useEffect, useRef } from 'react';
import { metricsMeta, project, roles, stages, tierMeta } from '../data/scenario.js';
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

function StageProgress({ stageIndex }) {
  return (
    <ol className="stage-list">
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
      <p>Команда проекта</p>
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

  return (
    <div className={`workspace is-${session.layout} ${locked ? 'is-locked' : ''}`}>
      <aside className="sidebar">
        <p className="eyebrow">Жизненный цикл</p>
        <StageProgress stageIndex={session.stageIndex} />
        {teamList}
        <div className="project-card">
          <p className="eyebrow">Ваш проект</p>
          <h2>{project.name}</h2>
          <p>{project.summary}</p>
          <p className="code">{project.code}</p>
          <p>{project.specialtyShort}</p>
        </div>
      </aside>

      <div className="board">
        <div className="stage-tabs" aria-label="Этапы">
          <StageProgress stageIndex={session.stageIndex} />
        </div>

        <div className="metrics-wrap" aria-live="polite">
          <Metrics metrics={session.metrics} deltas={locked ? entry?.applied : null} />
        </div>

        <div className="play">
        <section className="story" aria-labelledby="stage-title">
          <div className="crumb">
            <span>{project.name} / {stage.short}</span>
            <span>Этап {session.stageIndex + 1} из {stages.length}</span>
          </div>
          <p className="kicker">{stage.kicker}</p>
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

        <div className="play-main">
        <form
          className="choices"
          onSubmit={(event) => {
            event.preventDefault();
            if (!locked) onConfirm();
          }}
        >
          <div className="choices__head">
            <h2>Как вы поступите?</h2>
            <span>Одно решение</span>
          </div>
          <div
            className={`options ${session.layout === 'card' ? 'options--grid' : ''}`}
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
              <p>До кнопки выбор можно сменить.</p>
              <button type="submit" className="button" disabled={!session.selectedId}>
                Принять решение →
              </button>
            </div>
          )}
        </form>

        {locked && chosen && entry && (
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
                <span>Антипаттерн</span>
                {stage.antipattern}. {stage.antipatternHint}
              </p>
              <h3 className="reactions-head">Как это задело команду</h3>
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
                <p className="keep-going">Игра продолжается.</p>
              )}
            </div>
          </section>
        )}
        </div>
        </div>

        <footer className="board-foot">
        {teamList}
        <div className="board-foot__end">
          {locked && chosen && (
            <button type="button" className="button" onClick={onAdvance} disabled={Boolean(alarm)}>
              {last ? 'Посмотреть итог →' : 'Следующий этап →'}
            </button>
          )}
          <div className="pager" role="group" aria-label="Вид экрана">
          <button type="button" onClick={() => onLayout(session.layout === 'hq' ? 'card' : 'hq')} aria-label="Предыдущий вид">
            ‹
          </button>
          <span>{session.layout === 'hq' ? '1 / 2 · Штаб проекта' : '2 / 2 · Карточка миссии'}</span>
          <button type="button" onClick={() => onLayout(session.layout === 'hq' ? 'card' : 'hq')} aria-label="Следующий вид">
            ›
          </button>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
}
