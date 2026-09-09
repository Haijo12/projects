export default function Backlinks({ links, onOpen }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="backlinks-box">
      <h3>Linked from</h3>
      {links.map((note) => (
        <button
          key={note.id}
          type="button"
          className="backlink-item"
          onClick={() => onOpen(note)}
        >
          • {note.title || "Untitled"}
        </button>
      ))}
    </div>
  );
}
