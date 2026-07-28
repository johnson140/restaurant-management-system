import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

export default function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const token = localStorage.getItem("jwt"); // adjust to however you store the staff JWT

  async function loadData() {
    const headers = { Authorization: `Bearer ${token}` };
    const [ordersRes, tablesRes] = await Promise.all([
      fetch(`${API_BASE}/orders`, { headers }),
      fetch(`${API_BASE}/tables`, { headers }),
    ]);
    setOrders(await ordersRes.json());
    setTables(await tablesRes.json());
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // simple live refresh
    return () => clearInterval(interval);
  }, []);

  async function updateOrderStatus(id, status) {
    await fetch(`${API_BASE}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  async function updateTableStatus(id, status) {
    await fetch(`${API_BASE}/tables/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const activeOrders = orders.filter((o) => o.status !== "SERVED" && o.status !== "COMPLETED");
  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "New");
  const completedOrders = orders.filter((o) => o.status === "SERVED" || o.status === "COMPLETED");
  const activeTables = tables.filter((t) => t.status === "OCCUPIED");

  const nextStatus = { PENDING: "IN_KITCHEN", IN_KITCHEN: "READY", READY: "SERVED" };

  return (
    <div style={s.page}>
      <div style={s.statRow}>
        <StatCard label="Orders Today" value={ordersToday.length} color="#f97316" />
        <StatCard label="Active Tables" value={activeTables.length} color="#f97316" />
        <StatCard label="Pending Orders" value={pendingOrders.length} color="#dc2626" />
        <StatCard label="Active Orders" value={activeOrders.length} color="#dc2626" />
      </div>

      <h3>Active Orders</h3>
      <div>
        {activeOrders.map((order) => (
          <div key={order.id} style={s.orderRow}>
            <span style={s.orderTable}>Table {order.tableNumber}</span>
            <span style={s.badge}>{order.status}</span>
            <span>Rs.{order.totalAmount}</span>
            {nextStatus[order.status] && (
              <button style={s.actionBtn} onClick={() => updateOrderStatus(order.id, nextStatus[order.status])}>
                Update Status
              </button>
            )}
          </div>
        ))}
        {activeOrders.length === 0 && <p style={{ color: "#888" }}>No active orders.</p>}
      </div>

      <h3>Completed Orders</h3>
      {completedOrders.length === 0 && <p style={{ color: "#888" }}>No completed orders today.</p>}
      {completedOrders.map((order) => (
        <div key={order.id} style={s.orderRow}>
          <span style={s.orderTable}>Table {order.tableNumber}</span>
          <span style={s.badge}>{order.status}</span>
          <span>Rs.{order.totalAmount}</span>
        </div>
      ))}

      <h3>Restaurant Tables</h3>
      <div style={s.tableGrid}>
        {tables.map((t) => (
          <div
            key={t.id}
            style={{
              ...s.tableCard,
              borderColor: t.status === "AVAILABLE" ? "#16a34a" : "#dc2626",
              background: t.status === "AVAILABLE" ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <strong>Table {t.tableNumber}</strong>
            <div style={{ marginBottom: 8 }}>{t.status}</div>
            {["AVAILABLE", "OCCUPIED", "NEEDS_CLEANING"].map((status) => (
              <button key={status} style={s.smallBtn} onClick={() => updateTableStatus(t.id, status)}>
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderLeftColor: color }}>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const s = {
  page: { fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto", padding: 16 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "white", border: "1px solid #eee", borderLeft: "4px solid", borderRadius: 8, padding: 16 },
  orderRow: { display: "flex", alignItems: "center", gap: 16, padding: 12, border: "1px solid #eee", borderRadius: 8, marginBottom: 8 },
  orderTable: { fontWeight: 600, minWidth: 80 },
  badge: { background: "#fef3c7", padding: "2px 10px", borderRadius: 12, fontSize: 12 },
  actionBtn: { marginLeft: "auto", background: "#111", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer" },
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 },
  tableCard: { border: "1px solid", borderRadius: 8, padding: 12, textAlign: "center" },
  smallBtn: { display: "block", width: "100%", margin: "4px 0", padding: 6, borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" },
};
