export function StartScreen({ resume, onStart, onContinue }) {
  const finished = resume?.screen === 'result';
  return (
    <section className="start">
      <p className="eyebrow">Разработка и управление программным обеспечением · 09.02.11</p>
      <h1>Выпустите сервис, не потеряв команду</h1>
      <p className="lede">
        Вы руководите веб-проектом «Сервис записи». Впереди шесть этапов: от обещания заказчику до поддержки.
        Каждый ход меняет сроки, качество, состояние людей и доверие. Ошибочное решение игру не обрывает.
      </p>
      <ul className="facts">
        <li>5–8 минут</li>
        <li>6 этапов, 18 решений</li>
        <li>Можно обсуждать вместе</li>
      </ul>
      {resume && (
        <div className="resume">
          <p>
            {finished
              ? 'В этом браузере сохранено пройденное решение. Можно открыть итог или стереть его и начать заново.'
              : 'Есть незаконченное прохождение. Можно вернуться к нему или начать заново: старые решения сотрутся.'}
          </p>
          <div className="actions">
            <button type="button" className="button" onClick={onContinue} autoFocus>
              {finished ? 'Открыть итог' : 'Продолжить'}
            </button>
            <button type="button" className="button button--ghost" onClick={onStart}>
              Начать заново
            </button>
          </div>
        </div>
      )}
      {!resume && (
        <button type="button" className="button button--large" onClick={onStart} autoFocus>
          Начать проект
        </button>
      )}
    </section>
  );
}
