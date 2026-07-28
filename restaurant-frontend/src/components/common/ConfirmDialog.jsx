// Generic yes/no confirmation dialog. Used before any delete so a
// misclick can't destroy data. Kept deliberately dumb: the parent
// owns all state, this component just renders and reports clicks.
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-buttons">
          <button type="button" className="danger" onClick={onConfirm}>
            Delete
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
