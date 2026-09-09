// Consistent inline SVG icon set (24px grid, 2px stroke, round caps).
// All icons inherit `currentColor` and size via CSS (`width: 1em` default).

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

function I({ children, ...props }) {
  return (
    <svg {...base} {...props}>
      {children}
    </svg>
  );
}

export const BackIcon = (p) => (
  <I {...p}>
    <path d="M15 18l-6-6 6-6" />
  </I>
);

export const MoreIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
  </I>
);

export const SearchIcon = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </I>
);

export const CloseIcon = (p) => (
  <I {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </I>
);

export const PlusIcon = (p) => (
  <I {...p} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const SettingsIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </I>
);

export const PinIcon = ({ filled = false, ...p }) => (
  <I {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 17v5" />
    <path d="M9 3h6l-1 7 3 2v2H7v-2l3-2-1-7z" />
  </I>
);

export const StarIcon = ({ filled = false, ...p }) => (
  <I {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.5z" />
  </I>
);

export const ArchiveIcon = (p) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    <path d="M10 13h4" />
  </I>
);

export const TrashIcon = (p) => (
  <I {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
    <path d="M10 11v6M14 11v6" />
  </I>
);

export const RestoreIcon = (p) => (
  <I {...p}>
    <path d="M3 12a9 9 0 1 0 2.6-6.3" />
    <path d="M3 4v5h5" />
  </I>
);

export const DuplicateIcon = (p) => (
  <I {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </I>
);

export const EditIcon = (p) => (
  <I {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </I>
);

export const ExportIcon = (p) => (
  <I {...p}>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </I>
);

export const CommandIcon = (p) => (
  <I {...p}>
    <path d="M9 9V6a3 3 0 1 0-3 3h3zm0 0v6m0-6h6m-6 6v3a3 3 0 1 1-3-3h3zm6-6h3a3 3 0 1 0-3-3v3zm0 0v6m0 0h3a3 3 0 1 1-3 3v-3z" />
  </I>
);

export const CheckIcon = (p) => (
  <I {...p}>
    <path d="M20 6L9 17l-5-5" />
  </I>
);

export const NoteIcon = (p) => (
  <I {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h5" />
  </I>
);

// ---- Formatting toolbar icons ----

export const LinkIcon = (p) => (
  <I {...p}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </I>
);

export const ListIcon = (p) => (
  <I {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </I>
);

export const ChecklistIcon = (p) => (
  <I {...p}>
    <path d="M3 5.5l2 2L9 4" />
    <path d="M13 6h8M3 13.5l2 2L9 12" />
    <path d="M13 14h8" />
  </I>
);

export const QuoteIcon = (p) => (
  <I {...p}>
    <path d="M6 17h3l2-4V7H5v6h3z" />
    <path d="M14 17h3l2-4V7h-6v6h3z" />
  </I>
);

export const AtIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </I>
);

export const WikiIcon = (p) => (
  <I {...p}>
    <path d="M9 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4" />
    <path d="M5 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
  </I>
);

export const ChevronDownIcon = (p) => (
  <I {...p}>
    <path d="M6 9l6 6 6-6" />
  </I>
);

export const ChevronRightIcon = (p) => (
  <I {...p}>
    <path d="M9 18l6-6-6-6" />
  </I>
);
