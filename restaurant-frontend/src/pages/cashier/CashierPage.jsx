import { useEffect, useRef, useState } from "react";
import api from "@/services/axios";
import { useToast } from "@/context/ToastContext";


// How the cashier queue polls for new PAYMENT_REQUESTED orders. Kept in
// one place so it's easy to tune, and so KitchenQueue/ServiceBoard can
// eventually match it for consistency across staff pages.
const POLL_INTERVAL_MS = 3000;
const RECON_LS_KEY = "dineflow_reconciliations";

// Same two-tone chime used on the customer side, so the "something
// happened" sound is consistent across the whole app.
function playChime(ctx) {
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;

    [660, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const start = now + i * 0.12;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {
    console.log("Audio not available:", e);
  }
}

const PAYMENT_META = {
  CASH: { label: "Cash", icon: "💵", color: "#2e7d32", bg: "#e8f5e9" },
  UPI: { label: "UPI", icon: "📱", color: "#1565c0", bg: "#e3f2fd" },
  CARD: { label: "Card", icon: "💳", color: "#6a1b9a", bg: "#f3e5f5" },
};

function paymentMeta(method) {
  return PAYMENT_META[method] || { label: method || "—", icon: "❓", color: "#666", bg: "#f0f0f0" };
}

// "3m ago" / "just now" — cashiers care about how long someone's been
// standing there waiting on a confirm, not exact timestamps.
function timeSince(dateString) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

export default function CashierPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  // End-of-day reconciliation state
  const [countedCash, setCountedCash] = useState("");
  const [reconSaved, setReconSaved] = useState(null);
  const [todaysPaidCash, setTodaysPaidCash] = useState(0);

  const { showToast } = useToast();

  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    function unlockAudio() {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      window.removeEventListener("click", unlockAudio);
    }

    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  async function loadPayments() {
    try {
      const response = await api.get("/orders/payments/pending");
      const data = response.data;

      if (!isFirstLoadRef.current) {
        const newlyArrived = data.filter((o) => !knownIdsRef.current.has(o.id));
        if (newlyArrived.length > 0) {
          // Cash arrivals are the ones a cashier actually needs to act
          // on, so only chime/toast for those — a new UPI/Card request
          // isn't something anyone needs to be interrupted for right
          // now, since it's framed as auto-confirming.
          const cashArrivals = newlyArrived.filter((o) => o.paymentMethod === "CASH");

          if (cashArrivals.length > 0) {
            showToast(
              cashArrivals.length === 1
                ? `Table ${cashArrivals[0].tableNumber} is ready to pay (cash)`
                : `${cashArrivals.length} new cash payments waiting`,
              "success"
            );
            playChime(audioCtxRef.current);
          }
        }
      }

      knownIdsRef.current = new Set(data.map((o) => o.id));
      isFirstLoadRef.current = false;

      setOrders(data);
      setError("");
    } catch (err) {
      setError("Couldn't load pending payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull today's paid cash orders separately, since the pending-payments
  // endpoint above only tracks orders still awaiting confirmation.
  useEffect(() => {
    api
      .get("/orders")
      .then((res) => {
        const today = new Date().toDateString();
        const total = res.data
          .filter((o) => o.status === "PAID" && o.paymentMethod === "CASH")
          .filter((o) => new Date(o.paidAt || o.createdAt).toDateString() === today)
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        setTodaysPaidCash(total);
      })
      .catch(console.error);
  }, []);

  async function confirmPayment(id, tableNumber) {
    setConfirmingId(id);

    try {
      await api.patch(`/orders/${id}/status`, { status: "PAID" });
      showToast(`Table ${tableNumber} marked as paid`, "success");
      await loadPayments();
    } catch (err) {
      showToast("Couldn't confirm payment. Try again.", "error");
    } finally {
      setConfirmingId(null);
    }
  }

  function saveReconciliation() {
    const counted = Number(countedCash);
    if (isNaN(counted)) return;

    const report = {
      date: new Date().toDateString(),
      expectedCash: todaysPaidCash,
      countedCash: counted,
      difference: counted - todaysPaidCash,
      savedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem(RECON_LS_KEY) || "[]");
    existing.push(report);
    localStorage.setItem(RECON_LS_KEY, JSON.stringify(existing));

    setReconSaved(report);
    showToast("Reconciliation saved", "success");
  }

  const cashOrders = orders.filter((o) => o.paymentMethod === "CASH");
  const digitalOrders = orders.filter((o) => o.paymentMethod !== "CASH");

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Cashier</h1>
          <p style={styles.subheading}>Pending payments</p>
        </div>

        <div style={styles.countPillRow}>
          <div style={styles.countPill}>{cashOrders.length} cash</div>
          <div style={styles.countPillMuted}>{digitalOrders.length} digital</div>
        </div>
      </header>

      {loading && (
        <div style={styles.loadingWrap}>Loading pending payments…</div>
      )}

      {!loading && error && (
        <div style={styles.errorBox}>{error}</div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <p style={styles.emptyTitle}>All caught up</p>
          <p style={styles.emptyBody}>No one is waiting to pay right now.</p>
        </div>
      )}

      {!loading && !error && cashOrders.length > 0 && (
        <section style={{ marginBottom: 34 }}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Needs your confirmation</h2>
            <p style={styles.sectionHint}>
              Cash payments — confirm once you've received the money.
            </p>
          </div>

          <div style={styles.grid}>
            {cashOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isConfirming={confirmingId === order.id}
                onConfirm={() => confirmPayment(order.id, order.tableNumber)}
                urgent
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && digitalOrders.length > 0 && (
        <section>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitleMuted}>Digital payments</h2>
            <p style={styles.sectionHint}>
              UPI and card payments will confirm automatically once the
              payment gateway is connected. For now, you can still confirm
              these manually below if needed.
            </p>
          </div>

          <div style={styles.grid}>
            {digitalOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isConfirming={confirmingId === order.id}
                onConfirm={() => confirmPayment(order.id, order.tableNumber)}
                urgent={false}
              />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 40 }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>End-of-Day Reconciliation</h2>
          <p style={styles.sectionHint}>
            Expected cash today: ₹{todaysPaidCash}
          </p>
        </div>

        <div style={{ ...styles.card, maxWidth: 380 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>
            Cash counted
          </label>
          <input
            type="number"
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 8,
              marginBottom: 14,
              borderRadius: 10,
              border: "1px solid #ddd",
              fontSize: 15,
              boxSizing: "border-box",
            }}
            placeholder="Enter amount"
          />

          <button
            style={{
              ...styles.confirmButton,
              opacity: countedCash === "" ? 0.6 : 1,
              cursor: countedCash === "" ? "not-allowed" : "pointer",
            }}
            onClick={saveReconciliation}
            disabled={countedCash === ""}
          >
            Save Reconciliation
          </button>

          {reconSaved && (
            <div style={{ marginTop: 16, fontSize: 14 }}>
              <div>Expected: ₹{reconSaved.expectedCash}</div>
              <div>Counted: ₹{reconSaved.countedCash}</div>
              <div
                style={{
                  fontWeight: 800,
                  marginTop: 4,
                  color: reconSaved.difference === 0 ? "#2e7d32" : "#c62828",
                }}
              >
                {reconSaved.difference === 0
                  ? "Balanced ✅"
                  : reconSaved.difference > 0
                  ? `Excess: ₹${reconSaved.difference}`
                  : `Shortage: ₹${Math.abs(reconSaved.difference)}`}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order, isConfirming, onConfirm, urgent }) {
  const method = paymentMeta(order.paymentMethod);

  return (
    <div style={{ ...styles.card, ...(urgent ? {} : styles.cardMuted) }}>
      <div style={styles.cardTopRow}>
        <span style={styles.tableTag}>Table {order.tableNumber}</span>
        <span style={styles.timeTag}>{timeSince(order.createdAt)}</span>
      </div>

      <div style={styles.customerRow}>
        <span style={styles.customerName}>
          {order.customerName || "Guest"}
        </span>
        {order.customerPhone && (
          <span style={styles.customerPhone}>{order.customerPhone}</span>
        )}
      </div>

      <div style={styles.itemsList}>
        {(order.items || []).map((item) => (
          <div key={item.id} style={styles.itemRow}>
            <span style={styles.itemName}>
              {item.quantity}× {item.menuItem?.name}
            </span>
            <span style={styles.itemPrice}>
              ₹{(item.quantity * item.price).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.divider} />

      <div style={styles.bottomRow}>
        <div
          style={{
            ...styles.methodBadge,
            color: method.color,
            background: method.bg,
          }}
        >
          <span>{method.icon}</span>
          <span>{method.label}</span>
        </div>

        <span style={styles.totalAmount}>₹{order.totalAmount}</span>
      </div>

      {urgent ? (
        <button
          style={{
            ...styles.confirmButton,
            opacity: isConfirming ? 0.7 : 1,
          }}
          disabled={isConfirming}
          onClick={onConfirm}
        >
          {isConfirming ? "Confirming…" : "Confirm Payment"}
        </button>
      ) : (
        <div style={styles.autoRow}>
          <span style={styles.autoLabel}>
            <span style={styles.autoDot} />
            Awaiting automatic confirmation
          </span>

          <button
            style={{
              ...styles.confirmManualButton,
              opacity: isConfirming ? 0.7 : 1,
            }}
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "Confirming…" : "Confirm manually"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    fontFamily: "Arial, sans-serif",
    padding: "32px 28px 60px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
  },
  heading: { margin: 0, fontSize: 28, color: "#1a1a1a" },
  subheading: { margin: "4px 0 0", color: "#888", fontSize: 15 },
  countPillRow: {
    display: "flex",
    gap: 10,
  },
  countPill: {
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    padding: "8px 16px",
    borderRadius: 30,
  },
  countPillMuted: {
    background: "#eee",
    color: "#666",
    fontWeight: 700,
    fontSize: 14,
    padding: "8px 16px",
    borderRadius: 30,
  },
  loadingWrap: {
    textAlign: "center",
    padding: "80px 0",
    color: "#888",
    fontSize: 17,
  },
  errorBox: {
    background: "#fdecea",
    color: "#c62828",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  emptyState: {
    textAlign: "center",
    padding: "70px 20px",
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#333", margin: 0 },
  emptyBody: { color: "#999", marginTop: 6 },
  sectionHead: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#1a1a1a",
  },
  sectionTitleMuted: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#888",
  },
  sectionHint: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#999",
    maxWidth: 520,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 3px 14px rgba(0,0,0,.07)",
  },
  cardMuted: {
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    opacity: 0.85,
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tableTag: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ff6b00",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timeTag: { fontSize: 12, color: "#aaa" },
  customerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
  },
  customerName: { fontSize: 16, fontWeight: 700, color: "#1a1a1a" },
  customerPhone: { fontSize: 13, color: "#999" },
  itemsList: { marginBottom: 6 },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#555",
    padding: "4px 0",
  },
  itemName: { flex: 1, marginRight: 10 },
  itemPrice: { fontWeight: 600, color: "#333" },
  divider: { borderTop: "1px dashed #e5e5e5", margin: "14px 0" },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  methodBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 20,
  },
  totalAmount: { fontSize: 20, fontWeight: 800, color: "#1a1a1a" },
  confirmButton: {
    width: "100%",
    padding: 13,
    border: "none",
    borderRadius: 10,
    background: "#ff6b00",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  autoRow: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  autoLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#999",
    fontWeight: 600,
  },
  autoDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#f5a623",
    flexShrink: 0,
  },
  confirmManualButton: {
    width: "100%",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "#fff",
    color: "#666",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
