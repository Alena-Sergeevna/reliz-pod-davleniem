import { metricsMeta } from '../data/scenario.js';

function deltaText(delta, mode) {
  if (mode === 'total') {
    if (delta > 0) return `+${delta} за игру`;
    if (delta < 0) return `${delta} за игру`;
    return 'как в начале';
  }
  if (delta > 0) return `+${delta}, выросло`;
  if (delta < 0) return `${delta}, упало`;
  return 'без изменений';
}

function MetricCard({ meta, value, delta, mode }) {
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  let level = 'рабочий уровень';
  if (value < 25) level = 'критически мало';
  else if (value < 50) level = 'ниже устойчивого уровня';

  return (
    <article className={`metric ${delta < 0 ? 'is-down' : ''}`} aria-label={`${meta.full}: ${value} из 100. ${level}`}>
      <p className="metric__label">{meta.label}</p>
      <p className="metric__value">
        <strong>{value}</strong>
        <span>/ 100</span>
      </p>
      <div className="metric__track" aria-hidden="true">
        <div className="metric__fill" style={{ width: `${value}%` }} />
      </div>
      {value < 50 && <p className="metric__level">{level}</p>}
      {delta != null && <p className={`metric__delta metric__delta--${tone}`}>{deltaText(delta, mode)}</p>}
    </article>
  );
}

export function Metrics({ metrics, deltas, mode = 'step' }) {
  return (
    <div className="metrics">
      {metricsMeta.map((meta) => (
        <MetricCard
          key={meta.id}
          meta={meta}
          value={metrics[meta.id]}
          delta={deltas ? deltas[meta.id] : null}
          mode={mode}
        />
      ))}
    </div>
  );
}
