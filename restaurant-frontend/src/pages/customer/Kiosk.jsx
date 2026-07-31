import { useEffect, useRef, useState } from "react";

// Same env-var pattern as CustomerOrderPage.jsx and axios.js.
const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`;

// How often the kiosk re-checks table availability. 4s is frequent enough
// that a table freeing up (or getting booked) shows up quickly on the
// display, without hammering the backend from a screen that's meant to
// run unattended all day.
const POLL_INTERVAL_MS = 4000;

function customerUrlFor(token) {
  return `${window.location.origin}/customer?token=${token}`;
}

function qrImageUrlFor(token) {
  const url = customerUrlFor(token);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(url)}`;
}

// Public, unauthenticated display page — meant to be left open on a
// laptop/tablet at the entrance. It never claims or modifies any table
// itself; it only reads /tables and shows whichever one is currently
// first in line. The actual "booking" moment is still the customer's
// checkout button on CustomerOrderPage, same as before — this page just
// reflects that state back visually and picks the next one automatically
// once it does.
export default function Kiosk() {
  const [displayedTable, setDisplayedTable] = useState(null);
  const [noneAvailable, setNoneAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function refresh() {
    try {
      const response = await fetch(`${API_BASE}/tables`);

      if (!response.ok) {
        throw new Error("Could not load tables.");
      }

      const allTables = await response.json();

      // Lowest tableNumber first, matching the admin Tables page's own
      // ordering — so "which table shows next" is predictable rather
      // than depending on whatever order the DB happens to return.
      const available = allTables
        .filter((t) => t.status === "AVAILABLE")
        .sort((a, b) => a.tableNumber - b.tableNumber);

      if (available.length === 0) {
        setDisplayedTable(null);
        setNoneAvailable(true);
      } else {
        setDisplayedTable(available[0]);
        setNoneAvailable(false);
      }

      setError("");
    } catch (err) {
      // Don't blank the screen on a single failed poll (e.g. a brief
      // network hiccup) — keep showing the last good QR and just log it.
      // A kiosk left running all day shouldn't flash an error every time
      // one request stumbles.
      console.log("Kiosk refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={styles.page}>Loading...</div>;
  }

  if (noneAvailable) {
    return (
      <div style={styles.page}>
        <div style={styles.emoji}>💛</div>
        <h1 style={styles.title}>Sorry, we're fully booked right now</h1>
        <p style={styles.sub}>
          Every table is currently taken. Please check back with us again
          shortly — we'd love to have you!
        </p>
      </div>
    );
  }

  if (error && !displayedTable) {
    return <div style={styles.page}>{error}</div>;
  }

  return (
    <div style={styles.page}>
      <p style={styles.eyebrow}>Scan to view our menu</p>
      <h1 style={styles.tableLabel}>Table {displayedTable.tableNumber}</h1>

      <div style={styles.qrCard}>
        <img
          src={qrImageUrlFor(displayedTable.token)}
          alt={`QR code for table ${displayedTable.tableNumber}`}
          style={styles.qrImage}
        />
      </div>

      <p style={styles.hint}>
        Scan with your phone's camera to see the menu and place your order.
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    background: "#fff7f0",
  },
  eyebrow: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ff6b00",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  tableLabel: { fontSize: 44, margin: "0 0 30px", color: "#1a1a1a" },
  qrCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 30,
    boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
  },
  qrImage: { width: 320, height: 320, display: "block" },
  hint: { marginTop: 30, fontSize: 16, color: "#666", maxWidth: 420, lineHeight: 1.6 },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 30, margin: "0 0 10px", color: "#1a1a1a" },
  sub: { fontSize: 17, color: "#666", maxWidth: 420, lineHeight: 1.6 },
};
