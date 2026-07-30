import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// Same API_BASE logic as CustomerOrderPage — resolves to whichever host
// the page was actually opened from (phone's own browser after scanning
// the QR code, so this must NOT be hardcoded to localhost).
const API_BASE = `http://${window.location.hostname}:8080`;

// This is the page your QR code's URL (/receipt/:orderId) needs to
// resolve to. If this route isn't registered in your router, scanning
// the QR code will always fail no matter how correct the QR image
// itself is — that's almost certainly why it "isn't working" right now.
//
// Add this in your router setup (e.g. App.jsx), alongside your existing
// routes:
//
//   import ReceiptPage from "./pages/ReceiptPage";
//   <Route path="/receipt/:orderId" element={<ReceiptPage />} />
export default function ReceiptPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Receipt not found.");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={styles.loading}>Loading receipt...</div>;
  if (error) return <div style={styles.loading}>{error}</div>;
  if (!order) return null;

  const paidDate = new Date(order.paidAt || order.createdAt || Date.now());
  const dateLabel = paidDate.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeLabel = paidDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <span style={styles.brandName}>Baraka Restaurant</span>
          <span style={styles.paidTag}>{order.status === "PAID" ? "PAID" : order.status}</span>
        </div>

        <div style={styles.dateTimeRow}>
          <span>{dateLabel}</span>
          <span>{timeLabel}</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.metaGrid}>
          <Meta label="Receipt No." value={`#${order.id}`} />
          <Meta label="Table" value={order.tableNumber} />
          <Meta label="Customer" value={order.customerName} />
          <Meta label="Payment" value={order.paymentMethod} />
        </div>

        <div style={styles.divider} />

        <p style={styles.itemsHeading}>Items</p>

        {order.items.map((item) => (
          <div key={item.id} style={styles.itemRow}>
            <div>
              <div style={styles.itemName}>{item.menuItem.name}</div>
              <div style={styles.itemQty}>
                {item.quantity} × ₹{item.price}
              </div>
            </div>
            <span style={styles.itemAmount}>
              ₹{(item.quantity * item.price).toFixed(2)}
            </span>
          </div>
        ))}

        <div style={styles.divider} />

        <div style={styles.totalRow}>
          <span>Total Paid</span>
          <span>₹{order.totalAmount}</span>
        </div>

        <p style={styles.footerNote}>Thank you for visiting us!</p>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value}</div>
    </div>
  );
}

const styles = {
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    fontSize: 18,
    fontWeight: 600,
  },
  backdrop: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, #2f2b26 0%, #17140f 70%)",
    display: "flex",
    justifyContent: "center",
    padding: "60px 20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(400px, 92vw)",
    height: "fit-content",
    background: "#ffffff",
    borderRadius: 20,
    padding: "30px 26px",
    color: "#1a1a1a",
    boxShadow: "0 18px 45px rgba(0,0,0,.5)",
  },
  brandRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  brandName: { fontSize: 17, fontWeight: 800 },
  paidTag: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#2e7d32",
    background: "#e8f5e9",
    padding: "4px 10px",
    borderRadius: 20,
  },
  dateTimeRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },
  divider: { borderTop: "1px dashed #ddd", margin: "16px 0" },
  metaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 14, columnGap: 10 },
  metaLabel: { fontSize: 11, color: "#999", marginBottom: 3 },
  metaValue: { fontSize: 14, fontWeight: 700 },
  itemsHeading: { fontSize: 11, color: "#999", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: 600 },
  itemQty: { fontSize: 12, color: "#999", marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: 700 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 800 },
  footerNote: { textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 14 },
};
