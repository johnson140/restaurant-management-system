// KitchenQueue.jsx — full file
import { useEffect, useState, useRef } from "react";
import api from "@/services/axios";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { greetingForNow } from "@/utils/statusMeta";
import { FaFire, FaBowlFood } from "react-icons/fa6";

const COLUMNS = [
  { key: "PENDING", title: "New Orders", tone: "warning", nextStatus: "PREPARING", nextLabel: "Start Cooking" },
  { key: "PREPARING", title: "Cooking", tone: "info", nextStatus: "READY", nextLabel: "Mark Ready — Notify Waiter" },
];

// Simple two-tone "new order" chime — same technique as the customer
// page's payment sound, built with Web Audio so no file needs bundling.
function playNewOrderChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    [520, 780].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch (e) {
    console.log("Audio not available:", e);
  }
}

export default function KitchenQueue() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Tracks the previous PENDING count so we only chime when a NEW order
  // shows up, not on every 5-second poll.
  const prevPendingCount = useRef(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await api.get("/orders");
      const data = res.data;

      const pendingCount = data.filter((o) => o.status === "PENDING").length;

      if (prevPendingCount.current !== null && pendingCount > prevPendingCount.current) {
        playNewOrderChime();
      }
      prevPendingCount.current = pendingCount;

      setOrders(data);
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

  const activeCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PREPARING"
  ).length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  let subtitle = "All caught up — nothing waiting on the pass.";
  if (activeCount > 0) {
    subtitle = `${activeCount} order${activeCount > 1 ? "s" : ""} in the queue`;
  } else if (readyCount > 0) {
    subtitle = `${readyCount} order${readyCount > 1 ? "s" : ""} waiting for pickup`;
  }

  return (
    <div style={css.page}>
      <PageHeader
        eyebrow="KITCHEN"
        title={`${greetingForNow()}, ${user?.username || "Chef"}`}
        subtitle={subtitle}
      />

      <div style={css.board}>
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.key);

          return (
            <div key={column.key} style={css.column}>
              <div className={`status-${column.tone}`} style={css.columnHeader}>
                <h3 style={css.columnTitle}>{column.title}</h3>
                <span style={css.count}>{columnOrders.length}</span>
              </div>

              <div style={css.cards}>
                {loading && <EmptyState icon={<FaFire />} title="Loading..." />}

                {!loading && columnOrders.length === 0 && (
                  <EmptyState icon={<FaBowlFood />} title="Nothing here." />
                )}

                {columnOrders.map((order) => (
                  <Card key={order.id} style={css.orderCard}>
                    <div style={css.cardTop}>
                      <strong style={css.tableLabel}>Table {order.tableNumber}</strong>
                      <span style={css.price}>₹{order.totalAmount}</span>
                    </div>

                    <div style={css.items}>
                      {order.items && order.items.length > 0 ? (
                        <ul style={css.itemList}>
                          {order.items.map((item, i) => (
                            <li key={i}>
                              {item.quantity}× {item.menuItem?.name || "Unknown item"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No items listed"
                      )}
                    </div>

                    <Button
                      block
                      loading={updatingId === order.id}
                      onClick={() => advance(order.id, column.nextStatus)}
                    >
                      {column.nextLabel}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  board: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-5)" },
  column: { background: "var(--bg-page)", padding: "var(--space-4)", borderRadius: "var(--radius-xl)" },
  columnHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "var(--space-4)", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-5)",
  },
  columnTitle: { margin: 0, color: "var(--text-primary)" },
  count: {
    background: "var(--text-primary)", color: "var(--bg-surface)",
    padding: "5px 12px", borderRadius: "var(--radius-full)", fontWeight: "var(--font-weight-bold)",
  },
  cards: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  orderCard: { padding: "var(--space-5)" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" },
  tableLabel: { color: "var(--text-primary)" },
  price: { fontWeight: "var(--font-weight-bold)", color: "var(--color-success)" },
  items: { fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" },
  itemList: { margin: "6px 0 0 18px", padding: 0 },
};