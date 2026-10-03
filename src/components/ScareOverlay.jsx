export function ScareOverlay({ tier, line }) {
  const title = tier === 'risk' ? 'Неверно' : 'Неполно';
  return (
    <div className={`scare scare--${tier}`} role="alert">
      <div className="scare__wash" />
      <div className="scare__flash" />
      <div className="scare__stamp">
        <strong>{title}</strong>
        <span>{line}</span>
      </div>
    </div>
  );
}
