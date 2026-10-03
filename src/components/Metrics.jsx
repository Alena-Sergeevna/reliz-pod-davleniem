import { useEffect, useRef, useState } from 'react';
import { metricsMeta } from '../data/scenario.js';
import { motionAllowed } from '../logic/audio.js';

function useAnimatedNumber(value) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;
    if (!motionAllowed()) {
      fromRef.current = to;
      setShown(to);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 680);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}

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
  const shown = useAnimatedNumber(value);
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  let level = 'рабочий уровень';
  if (shown < 25) level = 'критически мало';
  else if (shown < 50) level = 'ниже устойчивого уровня';

  return (
    <article className={`metric ${delta < 0 ? 'is-down' : ''}`} aria-label={`${meta.full}: ${shown} из 100. ${level}`}>
      <p className="metric__label">{meta.label}</p>
      <p className="metric__value">
        <strong>{shown}</strong>
        <span>/ 100</span>
      </p>
      <div className="metric__track" aria-hidden="true">
        <div className="metric__fill" style={{ width: `${shown}%` }} />
      </div>
      {shown < 50 && <p className="metric__level">{level}</p>}
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
