/**
 * icon: any react-icons element (keep emoji out of system empty states —
 * emoji is reserved for one-off warmth moments like the Thank You screen)
 * title: short, plain — what's true right now ("No orders yet")
 * body: one sentence, an invitation to act if there's an action available
 */
export default function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty-state-ui">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      {body && <p className="empty-state-body">{body}</p>}
      {action && <div style={{ marginTop: "var(--space-4)" }}>{action}</div>}
    </div>
  );
}
