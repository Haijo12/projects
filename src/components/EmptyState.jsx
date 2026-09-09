export default function EmptyState({ icon, title, hint, children }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h2>{title}</h2>
      {hint && <p>{hint}</p>}
      {children}
    </div>
  );
}
