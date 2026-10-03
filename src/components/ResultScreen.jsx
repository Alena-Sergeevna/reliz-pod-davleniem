import { useEffect, useRef } from 'react';
import { project, stages, tierMeta } from '../data/scenario.js';
import { buildReview } from '../logic/scoring.js';
import { Metrics } from './Metrics.jsx';

export function ResultScreen({ session, onReplay }) {
  const review = buildReview(session.metrics, session.history);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section className="result">
      <p className="eyebrow">Итог проекта · {project.name}</p>
      <h1 tabIndex={-1} ref={titleRef}>{review.title}</h1>
      <p className="lede">{review.text}</p>
      <p className="weakest">{review.weakestLine}</p>
      <Metrics metrics={session.metrics} deltas={review.fromStart} mode="total" />

      <h2>Шесть решений</h2>
      <ol className="history">
        {stages.map((stage, index) => {
          const entry = session.history.find((item) => item.stageId === stage.id);
          const option = stage.options.find((item) => item.id === entry?.optionId);
          return (
            <li key={stage.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{stage.short}</strong>
                <b>{option ? option.title : 'Решение не записано'}</b>
                {option && <em>{tierMeta[option.tier].label}</em>}
                {option && <p>{option.consequenceTitle}. {stage.lesson}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <h2>Что стоит унести с собой</h2>
      <ul className="lessons">
        {review.lessons.map((lesson) => (
          <li key={lesson}>{lesson}</li>
        ))}
      </ul>

      <aside className="study">
        <h2>Как это связано с учёбой</h2>
        <p>
          На специальности {project.code} «{project.specialty}» веб-продукт собирают не в одиночку.
          Product Manager держит договорённость с заказчиком, дизайнер делает интерфейс понятным,
          архитектор следит за размером решения, разработчики пишут код, тестировщик проверяет поведение,
          инженер выпуска отвечает за повторную выкладку, поддержка не даёт просьбам потеряться после запуска.
        </p>
        <p>
          Вопрос для обсуждения: кого, кроме разработчика, вы позовёте в команду — и зачем?
        </p>
      </aside>

      <button type="button" className="button button--large" onClick={onReplay}>
        Пройти ещё раз
      </button>
    </section>
  );
}
