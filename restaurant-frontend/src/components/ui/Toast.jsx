/**
 * Render this from ToastContext in place of whatever currently renders
 * .toast-container / .toast. This replaces BOTH prior systems:
 *   - global.css's .toast-container/.toast (top-right, dark bg)
 *   - toaststyle.css + CustomerOrderPage's inline version (bottom-right)
 * Delete toaststyle.css once this is wired in — keeping both loaded
 * risked visibly conflicting styles on the same class names.
 *
 * Expects `toasts` as an array of { id, message, type } from
 * ToastContext, matching the existing showToast(message, type) calls
 * already used throughout the app.
 */
export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container-ui">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-ui ${toast.type === "error" ? "toast-ui-error" : ""}`}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
