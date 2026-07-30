import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Same props as the original components/common/ConfirmDialog.jsx —
// drop-in replacement, now built on the shared Modal/Button.
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>{message}</p>
    </Modal>
  );
}
