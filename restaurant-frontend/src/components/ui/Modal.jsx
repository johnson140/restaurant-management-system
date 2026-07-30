export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="modal-overlay-ui" onClick={onClose}>
      <div className="modal-card-ui" onClick={(e) => e.stopPropagation()}>
        {title && <h2 style={{ margin: "0 0 var(--space-5)" }}>{title}</h2>}
        {children}
        {footer && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-3)",
              marginTop: "var(--space-6)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
