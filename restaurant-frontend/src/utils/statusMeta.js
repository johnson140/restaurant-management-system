/**
 * Single source of truth for status → visual tone across the app.
 * Previously this map (or a near-identical copy) existed separately in:
 *   - Dashboard.jsx (TableTile colors)
 *   - ServiceBoard.jsx (TableTile colors — byte-for-byte duplicate)
 *   - Tables.jsx (STATUS_COLORS)
 *   - Orders.jsx (STATUS_STYLES, badge classnames)
 * Consolidating here means a status only needs a color decision once.
 *
 * `tone` maps directly to a StatusBadge/status-* CSS class.
 */

export const TABLE_STATUS_META = {
  AVAILABLE: { label: "Available", tone: "success" },
  OCCUPIED: { label: "Occupied", tone: "danger" },
  NEEDS_CLEANING: { label: "Needs Cleaning", tone: "warning" },
};

export const TABLE_STATUS_CYCLE = {
  AVAILABLE: "OCCUPIED",
  OCCUPIED: "NEEDS_CLEANING",
  NEEDS_CLEANING: "AVAILABLE",
};

export function getTableStatusMeta(status) {
  return TABLE_STATUS_META[status] || TABLE_STATUS_META.AVAILABLE;
}

export const ORDER_STATUS_META = {
  PENDING: { label: "Pending", tone: "warning" },
  PREPARING: { label: "Preparing", tone: "info" },
  READY: { label: "Ready", tone: "info" },
  SERVED: { label: "Served", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  PAYMENT_REQUESTED: { label: "Payment Requested", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS_META[status] || { label: status, tone: "neutral" };
}

export const PAYMENT_METHOD_META = {
  CASH: { label: "Cash", icon: "💵", tone: "success" },
  UPI: { label: "UPI", icon: "📱", tone: "info" },
  CARD: { label: "Card", icon: "💳", tone: "neutral" },
};

export function getPaymentMethodMeta(method) {
  return PAYMENT_METHOD_META[method] || { label: method || "—", icon: "❓", tone: "neutral" };
}

/**
 * Shared time-since-now formatter — replaces the 3 near-identical
 * greeting()/timeOfDay() and timeSince() helpers duplicated across
 * Dashboard, KitchenQueue, ServiceBoard, and CashierPage.
 */
export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function timeSince(dateString) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}
