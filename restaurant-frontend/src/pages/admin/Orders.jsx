import { useEffect, useState } from "react";
import api from "@/services/axios";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getOrderStatusMeta } from "@/utils/statusMeta";

const ACTIONS_BY_ROLE = {
  ADMIN: ["PREPARING", "READY", "SERVED"],
  CHEF: ["PREPARING", "READY"],
  WAITER: ["SERVED"],
};

const ACTION_LABELS = {
  PREPARING: "Start Preparing",
  READY: "Mark Ready",
  SERVED: "Mark Served",
};

const NEXT_STATUS = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};
// The single valid next step from each status. Only this one action is
// ever shown per order — no jumping ahead, no stale actions on finished
// orders.

function Orders() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const allowedActions = ACTIONS_BY_ROLE[role] || [];

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error(error);
      showToast("Could not load orders", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      setUpdatingId(id);
      await api.patch(`/orders/${id}/status`, { status });
      showToast(`Order #${id} marked ${status.toLowerCase()}`);
      await fetchOrders();
    } catch (error) {
      console.error(error);
      showToast("Could not update order status", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleOrders = orders.filter((order) => {
    if (role === "CHEF") {
      return order.status === "PENDING" || order.status === "PREPARING";
    }
    if (role === "WAITER") {
      return order.status === "READY" || order.status === "COMPLETED";
    }
    return true;
  });

  const emptyMessage =
    role === "CHEF"
      ? "No orders waiting on the kitchen."
      : role === "WAITER"
      ? "No orders ready to serve."
      : "No orders yet.";

  return (
    <div>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Orders"
        subtitle={`${visibleOrders.length} order${visibleOrders.length === 1 ? "" : "s"} shown`}
        actions={
          <Button variant="secondary" onClick={fetchOrders}>
            Refresh
          </Button>
        }
      />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <tbody>
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title="Nothing here" body={emptyMessage} />
                  </td>
                </tr>
              )}

              {visibleOrders.map((order) => {
                const meta = getOrderStatusMeta(order.status);
                const next = NEXT_STATUS[order.status];
                const canAct = next && allowedActions.includes(next);

                return (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.td}>{order.id}</td>
                    <td style={styles.td}>
                      <StatusBadge status={order.status} label={meta.label} tone={meta.tone} />
                    </td>
                    <td style={styles.td}>₹{order.totalAmount}</td>
                    <td style={styles.td}>
                      {canAct ? (
                        <Button
                          size="sm"
                          loading={updatingId === order.id}
                          onClick={() => updateStatus(order.id, next)}
                        >
                          {ACTION_LABELS[next]}
                        </Button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
                          {order.status === "COMPLETED" ? "—" : "No action available"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </Card>
    </div>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "var(--space-4) var(--space-6)",
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-bold)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-color)",
  },
  tr: { borderBottom: "1px solid var(--border-color)" },
  td: {
    padding: "var(--space-4) var(--space-6)",
    color: "var(--text-primary)",
    fontSize: "var(--font-size-base)",
  },
};

export default Orders;