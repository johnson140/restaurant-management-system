import { useEffect, useState } from "react";
import api from "@/services/axios";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import NewOrderModal from "@/components/modals/NewOrderModal";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import TableStatusTile from "@/components/ui/TableStatusTile";
import { greetingForNow } from "@/utils/statusMeta";
import { FaBellConcierge, FaChair } from "react-icons/fa6";

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
      const [tablesRes, ordersRes] = await Promise.all([api.get("/tables"), api.get("/orders")]);
      setTables(tablesRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load service board", "error");
    } finally {
      setLoading(false);
    }
  }

  // Table status is now fully automatic — OCCUPIED is set the moment a
  // customer's checkout succeeds, and AVAILABLE is set automatically
  // once the customer finishes/skips their review. Waiters can see
  // status here but no longer have a control to override it, so
  // TableStatusTile is rendered without an onSetStatus handler below.

  async function markServed(id) {
    try {
      setUpdatingId(id);
      await api.patch(`/orders/${id}/status`, { status: "SERVED" });
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
      <PageHeader
        eyebrow="SERVICE"
        title={`${greetingForNow()}, ${user?.username || "there"}`}
        subtitle={
          readyOrders.length > 0
            ? `${readyOrders.length} order${readyOrders.length > 1 ? "s" : ""} ready to serve`
            : "Nothing waiting to be served right now."
        }
        actions={<Button onClick={() => setOrderModalOpen(true)}>+ New Order</Button>}
      />

      <div style={css.twoCol}>
        <Card>
          <h3 style={css.panelTitle}>Ready to Serve</h3>

          <div style={css.cards}>
            {loading && <EmptyState icon={<FaBellConcierge />} title="Loading..." />}
            {!loading && readyOrders.length === 0 && (
              <EmptyState icon={<FaBellConcierge />} title="No orders ready yet." />
            )}

            {readyOrders.map((order) => (
              <div key={order.id} style={css.orderRow}>
                <div style={css.cardTop}>
                  <strong style={css.tableLabel}>Table {order.tableNumber}</strong>
                  <span style={css.price}>₹{order.totalAmount}</span>
                </div>

                <Button
                  block
                  variant="secondary"
                  loading={updatingId === order.id}
                  onClick={() => markServed(order.id)}
                >
                  Mark Served
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={css.panelTitle}>Tables</h3>

          <div style={css.tableGrid}>
            {tables.length === 0 ? (
              <EmptyState icon={<FaChair />} title="No tables yet." />
            ) : (
              tables.map((table) => (
                // No onSetStatus passed — tile is view-only here.
                // Status transitions happen automatically elsewhere
                // (checkout and the customer review flow).
                <TableStatusTile key={table.id} table={table} readOnly />
              ))
            )}
          </div>
        </Card>
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

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  twoCol: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "var(--space-6)", alignItems: "start",
  },
  panelTitle: { margin: "0 0 var(--space-5) 0", fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--text-primary)" },
  cards: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  orderRow: { background: "var(--bg-page)", padding: "var(--space-4)", borderRadius: "var(--radius-md)" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" },
  tableLabel: { color: "var(--text-primary)" },
  price: { fontWeight: "var(--font-weight-bold)", color: "var(--color-success)" },
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: "var(--space-4)" },
};
