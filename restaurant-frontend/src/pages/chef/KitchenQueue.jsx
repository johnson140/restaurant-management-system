import { useEffect, useState } from "react";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

// A chef's entire job in this app lives on this one screen: what needs
// cooking, what's cooking, what's done. There is no separate "Orders"
// page for a chef — this IS their orders page, framed around kitchen
// work instead of a generic status table.
const COLUMNS = [
  { key: "PENDING", title: "New Orders", color: "#f59e0b", nextStatus: "PREPARING", nextLabel: "Start Cooking" },
  { key: "PREPARING", title: "Cooking", color: "#3b82f6", nextStatus: "READY", nextLabel: "Mark Ready" },
];

export default function KitchenQueue() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load kitchen queue", "error");
    } finally {
      setLoading(false);
    }
  }

  async function advance(id, nextStatus) {
    try {
      setUpdatingId(id);
      await api.patch(`/orders/${id}/status`, { status: nextStatus });
      await fetchOrders();
    } catch (err) {
      console.error(err);
      showToast("Could not update order", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div style={css.page}>
      <header style={css.header}>
        <div>
          <div style={css.eyebrow}>KITCHEN</div>
          <h1 style={css.h1}>
            {greeting()}, {user?.username || "Chef"}
          </h1>
          <p style={css.subtitle}>
            {readyCount > 0
              ? `${readyCount} order${readyCount > 1 ? "s" : ""} waiting for pickup`
              : "All caught up — nothing waiting on the pass."}
          </p>
        </div>
      </header>

      <div style={css.board}>
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.key);

          return (
            <div key={column.key} style={css.column}>
              <div style={{ ...css.columnHeader, borderLeft: `5px solid ${column.color}` }}>
                <h3 style={css.columnTitle}>{column.title}</h3>
                <span style={css.count}>{columnOrders.length}</span>
              </div>

              <div style={css.cards}>
                {loading && <div style={css.empty}>Loading...</div>}

                {!loading && columnOrders.length === 0 && (
                  <div style={css.empty}>Nothing here.</div>
                )}

                {columnOrders.map((order) => (
                  <div key={order.id} style={css.card}>
                    <div style={css.cardTop}>
                      <strong style={css.tableLabel}>Table {order.tableNumber}</strong>
                      <span style={css.price}>₹{order.totalAmount}</span>
                    </div>

                    <div style={css.items}>
                      {order.items && order.items.length > 0 ? (
                        <ul style={css.itemList}>
                          {order.items.map((item, i) => (
                            <li key={i}>
                              {item.quantity}× {item.menuItemName || item.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        `${order.items?.length || 0} items`
                      )}
                    </div>

                    <button
                      style={css.advanceBtn}
                      disabled={updatingId === order.id}
                      onClick={() => advance(order.id, column.nextStatus)}
                    >
                      {updatingId === order.id ? "Updating..." : column.nextLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  header: { marginBottom: 28 },
  eyebrow: {
    fontSize: 12, fontWeight: 700, letterSpacing: 2,
    color: "var(--text-muted)", textTransform: "uppercase",
  },
  h1: { fontSize: 30, marginTop: 8, marginBottom: 6, color: "var(--text-primary)", fontWeight: 700 },
  subtitle: { color: "var(--text-secondary)", fontSize: 15, margin: 0 },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  column: { background: "var(--bg-page)", padding: 18, borderRadius: 22 },
  columnHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "var(--bg-surface)", padding: "16px", borderRadius: 16, marginBottom: 18,
  },
  columnTitle: { margin: 0, color: "var(--text-primary)" },
  count: { background: "#0f172a", color: "white", padding: "5px 12px", borderRadius: 30, fontWeight: 700 },
  cards: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "var(--bg-surface)", padding: 18, borderRadius: 18,
    boxShadow: "0 12px 30px var(--shadow-panel)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  tableLabel: { color: "var(--text-primary)" },
  price: { fontWeight: 700, color: "#10b981" },
  items: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 },
  itemList: { margin: "6px 0 0 18px", padding: 0 },
  advanceBtn: {
    width: "100%", padding: "10px", borderRadius: 10, border: "none",
    background: "#2563eb", color: "white", fontWeight: 600, cursor: "pointer",
  },
  empty: { color: "var(--text-muted)", fontStyle: "italic", padding: 20, textAlign: "center" },
};
