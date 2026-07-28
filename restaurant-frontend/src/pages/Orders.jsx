import { useEffect, useState } from "react";
import api from "../services/axios";
import { TableSkeleton } from "../components/common/Skeleton";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  PENDING: "badge-yellow",
  PREPARING: "badge-blue",
  READY: "badge-purple",
  COMPLETED: "badge-green",
};

// What each role is actually allowed to DO to an order, not just see.
// A chef decides when food starts/finishes cooking. A waiter decides
// when a ready order has been delivered to the table. Admin can do both.
const ACTIONS_BY_ROLE = {
  ADMIN: ["PREPARING", "READY", "COMPLETED"],
  CHEF: ["PREPARING", "READY"],
  WAITER: ["COMPLETED"],
};

const ACTION_LABELS = {
  PREPARING: "Start Preparing",
  READY: "Mark Ready",
  COMPLETED: "Mark Served",
};

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

  // Chefs only need to look at orders that still need kitchen attention.
  // Waiters only need to look at orders ready to be delivered (or already
  // served, for reference). Admin sees the full list.
  const visibleOrders = orders.filter((order) => {
    if (role === "CHEF") {
      return order.status === "PENDING" || order.status === "PREPARING";
    }
    if (role === "WAITER") {
      return order.status === "READY" || order.status === "COMPLETED";
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Orders</h2>
        <button onClick={fetchOrders}>Refresh</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <tbody>
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    {role === "CHEF"
                      ? "No orders waiting on the kitchen."
                      : role === "WAITER"
                      ? "No orders ready to serve."
                      : "No orders yet."}
                  </td>
                </tr>
              )}

              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    <span
                      className={`badge ${
                        STATUS_STYLES[order.status] || "badge-gray"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>₹{order.totalAmount}</td>

                  <td>
                    {allowedActions.map((status) => (
                      <button
                        key={status}
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, status)}
                      >
                        {ACTION_LABELS[status]}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

export default Orders;
