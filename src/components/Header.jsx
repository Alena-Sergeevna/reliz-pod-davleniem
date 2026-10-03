export function Header({ muted, onToggleMute }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">R</span>
        <span>
          <strong>Релиз под давлением</strong>
          <small>Симулятор командной веб-разработки</small>
        </span>
      </div>
      <button
        type="button"
        className={`icon-button ${muted ? 'is-muted' : ''}`}
        aria-pressed={muted}
        aria-label={muted ? 'Включить звук' : 'Выключить звук'}
        onClick={onToggleMute}
      >
        <span aria-hidden="true">{muted ? 'Звук выкл.' : 'Звук'}</span>
      </button>
    </header>
  );
}
