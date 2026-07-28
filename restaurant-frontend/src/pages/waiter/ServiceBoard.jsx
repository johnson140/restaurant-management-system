import { useEffect, useState } from "react";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import NewOrderModal from "../../components/modals/NewOrderModal";

// A waiter's whole job lives here: which tables need attention, which
// orders are ready to carry out, and a way to start a new order for a
// table. No kitchen controls, no revenue numbers — those aren't this
// role's job.
export default function ServiceBoard() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        api.get("/tables"),
        api.get("/orders"),
      ]);
      setTables(tablesRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load service board", "error");
    } finally {
      setLoading(false);
    }
  }

  async function setTableStatus(id, status) {
    try {
      await api.patch(`/tables/${id}/status`, { status });
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Could not update table", "error");
    }
  }

  async function markServed(id) {
    try {
      setUpdatingId(id);
      await api.patch(`/orders/${id}/status`, { status: "COMPLETED" });
      showToast(`Order #${id} marked served`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Could not update order", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const readyOrders = orders.filter((o) => o.status === "READY");

  return (
    <div style={css.page}>
      <header style={css.header}>
        <div>
          <div style={css.eyebrow}>SERVICE</div>
          <h1 style={css.h1}>
            {greeting()}, {user?.username || "there"}
          </h1>
          <p style={css.subtitle}>
            {readyOrders.length > 0
              ? `${readyOrders.length} order${readyOrders.length > 1 ? "s" : ""} ready to serve`
              : "Nothing waiting to be served right now."}
          </p>
        </div>

        <button style={css.newOrderBtn} onClick={() => setOrderModalOpen(true)}>
          + New Order
        </button>
      </header>

      <div style={css.twoCol}>
        <div style={css.panel}>
          <h3 style={css.panelTitle}>Ready to Serve</h3>

          <div style={css.cards}>
            {loading && <div style={css.empty}>Loading...</div>}
            {!loading && readyOrders.length === 0 && (
              <div style={css.empty}>No orders ready yet.</div>
            )}

            {readyOrders.map((order) => (
              <div key={order.id} style={css.card}>
                <div style={css.cardTop}>
                  <strong style={css.tableLabel}>Table {order.tableNumber}</strong>
                  <span style={css.price}>₹{order.totalAmount}</span>
                </div>

                <button
                  style={css.serveBtn}
                  disabled={updatingId === order.id}
                  onClick={() => markServed(order.id)}
                >
                  {updatingId === order.id ? "Updating..." : "Mark Served"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={css.panel}>
          <h3 style={css.panelTitle}>Tables</h3>

          <div style={css.tableGrid}>
            {tables.length === 0 ? (
              <div style={css.empty}>No tables yet.</div>
            ) : (
              tables.map((table) => (
                <TableTile key={table.id} table={table} onSetStatus={setTableStatus} />
              ))
            )}
          </div>
        </div>
      </div>

      <NewOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onCreated={() => {
          setOrderModalOpen(false);
          loadData();
        }}
        tables={tables}
      />
    </div>
  );
}

function TableTile({ table, onSetStatus }) {
  const colors = {
    AVAILABLE: { bg: "#ecfdf5", border: "#10b981", text: "#047857" },
    OCCUPIED: { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
    NEEDS_CLEANING: { bg: "#fffbeb", border: "#f59e0b", text: "#b45309" },
  };
  const c = colors[table.status] || colors.AVAILABLE;
  const cycle = { AVAILABLE: "OCCUPIED", OCCUPIED: "NEEDS_CLEANING", NEEDS_CLEANING: "AVAILABLE" };

  return (
    <div
      style={{ ...css.tableTile, background: c.bg, borderColor: c.border, color: c.text }}
      onClick={() => onSetStatus(table.id, cycle[table.status] || "AVAILABLE")}
      title="Tap to cycle status"
    >
      <div style={{ fontWeight: 700 }}>T{table.tableNumber}</div>
      <div style={{ fontSize: 11 }}>{table.status.replace("_", " ")}</div>
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
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: 16, marginBottom: 28,
  },
  eyebrow: {
    fontSize: 12, fontWeight: 700, letterSpacing: 2,
    color: "var(--text-muted)", textTransform: "uppercase",
  },
  h1: { fontSize: 30, marginTop: 8, marginBottom: 6, color: "var(--text-primary)", fontWeight: 700 },
  subtitle: { color: "var(--text-secondary)", fontSize: 15, margin: 0 },
  newOrderBtn: {
    padding: "14px 22px", borderRadius: 14, border: "none",
    background: "#2563eb", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
    boxShadow: "0 10px 25px rgba(37,99,235,.35)",
  },
  twoCol: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24, alignItems: "start",
  },
  panel: {
    background: "var(--bg-surface)", borderRadius: 18, padding: 22,
    border: "1px solid var(--border-color)", boxShadow: "0 8px 24px var(--shadow-panel)",
  },
  panelTitle: { margin: "0 0 18px 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" },
  cards: { display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "var(--bg-page)", padding: 16, borderRadius: 14 },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  tableLabel: { color: "var(--text-primary)" },
  price: { fontWeight: 700, color: "#10b981" },
  serveBtn: {
    width: "100%", padding: "10px", borderRadius: 10, border: "none",
    background: "#10b981", color: "white", fontWeight: 600, cursor: "pointer",
  },
  tableGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: 14,
  },
  tableTile: {
    padding: 18, borderRadius: 14, border: "2px solid", textAlign: "center",
    cursor: "pointer", transition: ".25s", fontWeight: 600,
  },
  empty: { color: "var(--text-muted)", fontStyle: "italic", padding: 20, textAlign: "center" },
};
