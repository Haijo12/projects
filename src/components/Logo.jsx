// Brand mark — the same design as the app icons: violet squircle + note card.
// Rendered inline so it always renders crisply and never depends on a cache.
export default function Logo({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Notes logo"
    >
      <rect width="64" height="64" rx="14" fill="#7c3aed" />
      <rect x="18" y="14" width="28" height="36" rx="4" fill="#ffffff" />
      <rect x="24" y="22" width="16" height="2.5" rx="1.25" fill="#a98ffc" />
      <rect x="24" y="28" width="16" height="2" rx="1" fill="#d4d4d8" />
      <rect x="24" y="33" width="12" height="2" rx="1" fill="#d4d4d8" />
      <rect x="24" y="40" width="16" height="2" rx="1" fill="#d4d4d8" />
    </svg>
  );
}
