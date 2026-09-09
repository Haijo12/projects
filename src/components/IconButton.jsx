// Reusable icon button — consistent 44px touch target with a pinned-size icon.
// All app icon buttons should use this so sizes/pressed states never diverge.
export default function IconButton({ icon: Icon, label, size = 22, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`.trim()}
      aria-label={label}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
