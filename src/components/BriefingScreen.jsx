import { metricsMeta, project, roles } from '../data/scenario.js';

export function BriefingScreen({ onNext }) {
  return (
    <section className="briefing">
      <div className="briefing__body">
        <header className="briefing__intro">
          <p className="eyebrow">Знакомство с проектом</p>
          <h1>{project.name}</h1>
          <p className="lede">{project.pitch}</p>
          <p className="specialty">
            <strong>{project.code}</strong> {project.specialty}
          </p>
        </header>

        <section className="briefing__block" aria-labelledby="metrics-title">
          <h2 id="metrics-title">Четыре показателя</h2>
          <p>Старт у каждого — 70 из 100. Ниже нуля и выше ста значение не уходит.</p>
          <div className="explain-grid">
            {metricsMeta.map((item) => (
              <article key={item.id}>
                <h3>
                  {item.full}
                  <span>70</span>
                </h3>
                <p>{item.about}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="briefing__block" aria-labelledby="team-title">
          <h2 id="team-title">Команда</h2>
          <p>Роли видят одну работу по-разному. Ход руководителя сдвигает нагрузку между ними.</p>
          <ul className="role-grid">
            {roles.map((role) => (
              <li key={role.id}>
                <strong>{role.name}</strong>
                <span>{role.about}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button type="button" className="button button--large" onClick={onNext}>
        К первому этапу
      </button>
    </section>
  );
}
