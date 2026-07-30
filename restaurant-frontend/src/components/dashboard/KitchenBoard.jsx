// components/dashboard/KitchenBoard.jsx — full file
const COLUMNS = [
  { key: "PENDING", title: "New Orders", color: "#f59e0b" },
  { key: "PREPARING", title: "Cooking", color: "#3b82f6" },
  { key: "READY", title: "Ready for Pickup", color: "#10b981" },
];

export default function KitchenBoard({ orders, onSelectOrder }) {
  return (
    <div style={styles.board}>
      {COLUMNS.map((column) => (
        <div key={column.key} style={styles.column}>
          <div style={{ ...styles.header, borderLeft: `5px solid ${column.color}` }}>
            <h3 style={styles.headerTitle}>{column.title}</h3>
            <span style={styles.count}>
              {orders.filter((o) => o.status === column.key).length}
            </span>
          </div>

          <div style={styles.cards}>
            {orders
              .filter((o) => o.status === column.key)
              .map((o) => (
                <div key={o.id} style={styles.card} onClick={() => onSelectOrder?.(o)}>
                  <div style={styles.top}>
                    <strong style={styles.tableLabel}>Table {o.tableNumber}</strong>
                    <span style={styles.price}>₹{o.totalAmount}</span>
                  </div>
                  <div style={styles.items}>{o.items?.length || 0} items</div>
                  <div style={styles.footer}>View details →</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  board: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 20 },
  column: { background: "var(--bg-page)", padding: 18, borderRadius: 22, minHeight: 400 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", padding: "16px", borderRadius: 16, marginBottom: 18 },
  headerTitle: { margin: 0, color: "var(--text-primary)" },
  count: { background: "#0f172a", color: "white", padding: "5px 12px", borderRadius: 30, fontWeight: 700 },
  cards: { display: "flex", flexDirection: "column", gap: 16 },
  card: { background: "var(--bg-surface)", padding: 18, borderRadius: 18, cursor: "pointer", boxShadow: "0 12px 30px var(--shadow-panel)" },
  top: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  tableLabel: { color: "var(--text-primary)" },
  price: { fontWeight: 700, color: "#10b981" },
  items: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 },
  footer: { fontSize: 12, fontWeight: 600, color: "#2563eb" },
};