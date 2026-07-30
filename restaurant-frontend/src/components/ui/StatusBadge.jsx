/**
 * status: the raw status string (e.g. "PREPARING", "OCCUPIED")
 * label: display text (usually looked up via statusMeta.js helpers)
 * tone: "success" | "warning" | "danger" | "info" | "neutral"
 *
 * Keying the outer span on `status` re-mounts it whenever the status
 * changes, which re-triggers the CSS entrance animation — this is how
 * every status badge in the app (order status, table status, payment
 * method) gets a consistent "something changed" pulse without each
 * page having to implement its own transition.
 */
export default function StatusBadge({ status, label, tone = "neutral", dot = false }) {
  return (
    <span key={status} className={`status-badge status-${tone}`}>
      {dot && <span className="status-badge-dot" />}
      {label}
    </span>
  );
}
