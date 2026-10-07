import { metricsMeta, project, roles } from '../data/scenario.js';

const metricPlain = {
  time: 'Успеете ли закончить к пятнице.',
  quality: 'Не сломается ли сайт у людей.',
  team: 'Хватает ли сил и не держится ли всё на одном человеке.',
  trust: 'Понимает ли заказчик, что получит.',
};

const rolePlain = {
  pm: 'общается с заказчиком и договаривается, что войдёт в версию',
  design: 'превращает пожелания заказчика в понятные экраны',
  architect: 'решает, из каких частей состоит система и как они связаны',
  dev: 'разрабатывают сайт и систему',
  qa: 'ищет, где сайт ломается',
  devops: 'публикует версии и следит за работой сайта на серверах',
  support: 'принимает жалобы пользователей и передаёт ошибки команде',
};

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

        <section className="briefing__block" aria-labelledby="howto-title">
          <h2 id="howto-title">Что будет дальше</h2>
          <ol className="briefing-steps">
            <li>
              <strong>Ситуация</strong>
              <span>На каждом из шести этапов — проблема и три хода. Верный заранее не отмечен.</span>
            </li>
            <li>
              <strong>Решение</strong>
              <span>Пока не нажали «Принять решение», выбор можно сменить.</span>
            </li>
            <li>
              <strong>Последствия</strong>
              <span>Меняются числа и команда. Ошибка не обрывает игру: идёте дальше по этапам.</span>
            </li>
          </ol>
        </section>

        <section className="briefing__block" aria-labelledby="metrics-title">
          <h2 id="metrics-title">Четыре числа</h2>
          <p>Старт у каждого — 70 из 100. Ниже 50 уже тревожно. Хороший ход может улучшить качество и всё равно потратить время.</p>
          <div className="explain-grid">
            {metricsMeta.map((item) => (
              <article key={item.id}>
                <h3>
                  {item.full}
                  <span>70</span>
                </h3>
                <p>{metricPlain[item.id]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="briefing__block" aria-labelledby="team-title">
          <h2 id="team-title">Кто в команде</h2>
          <p>Эти люди появятся в ответах. Ваш ход сдвигает нагрузку между ними.</p>
          <ul className="role-grid">
            {roles.map((role) => (
              <li key={role.id}>
                <strong>{role.name}</strong>
                <span>{rolePlain[role.id]}</span>
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
