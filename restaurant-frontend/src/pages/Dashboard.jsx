import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroCard from "../components/dashboard/HeroCard";
import QuickActions from "../components/dashboard/QuickActions";
import KitchenBoard from "../components/dashboard/KitchenBoard";
import SectionTitle from "../components/dashboard/SectionTitle";
import { useAuth } from "../context/AuthContext";

import {
  FaClipboardList,
  FaIndianRupeeSign,
  FaChair,
  FaUtensils,
} from "react-icons/fa6";

const API_BASE = "http://localhost:8080";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuCount, setMenuCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);

  const token = localStorage.getItem("token");

  async function loadData() {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      // Chefs and waiters don't have access to /menu or /staff, so only
      // request what the current role is actually allowed to see.
      const requests = [
        fetch(`${API_BASE}/orders`, { headers }),
        fetch(`${API_BASE}/tables`, { headers }),
      ];

      if (role === "ADMIN") {
        requests.push(fetch(`${API_BASE}/menu`, { headers }));
        requests.push(fetch(`${API_BASE}/staff`, { headers }));
      }

      const responses = await Promise.all(requests);
      const [ordersRes, tablesRes, menuRes, staffRes] = responses;

      if (!ordersRes.ok) throw new Error("Orders request failed");
      if (!tablesRes.ok) throw new Error("Tables request failed");

      const ordersData = await ordersRes.json();
      const tablesData = await tablesRes.json();

      setOrders(ordersData);
      setTables(tablesData);

      if (role === "ADMIN") {
        if (!menuRes.ok) throw new Error("Menu request failed");
        if (!staffRes.ok) throw new Error("Staff request failed");

        const menuData = await menuRes.json();
        const staffData = await staffRes.json();

        setMenuCount(menuData.length);
        setStaffCount(staffData.length);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [role]);

  async function cycleOrderStatus(id, current) {
    const next = { PENDING: "IN_KITCHEN", IN_KITCHEN: "READY", READY: "SERVED" }[current];
    if (!next) return;
    await fetch(`${API_BASE}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: next }),
    });
    loadData();
  }

  async function setTableStatus(id, status) {
    await fetch(`${API_BASE}/tables/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const revenueToday = ordersToday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrders = orders.filter((o) => o.status !== "SERVED" && o.status !== "COMPLETED");
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;

  const recentActivity = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const showRevenueAndResources = role === "ADMIN";
  const showTables = role === "ADMIN" || role === "WAITER";
  const showKitchenBoard = role === "ADMIN" || role === "CHEF";
  const showRecentActivity = role === "ADMIN" || role === "WAITER";

  return (
    <div style={css.page}>
      <header style={css.header}>
        <div>
          <div style={css.eyebrow}>OVERVIEW</div>
          <h1 style={css.h1}>
            Good {timeOfDay()}, let's see how service is going
          </h1>
        </div>
      </header>

      <section style={css.heroGrid}>
        <HeroCard
          title="Orders Today"
          value={ordersToday.length}
          subtitle={`${activeOrders.length} active`}
          icon={<FaClipboardList />}
          color="#ff7a00"
          onClick={() => navigate("/orders")}
        />

        {showRevenueAndResources && (
          <HeroCard
            title="Revenue Today"
            value={`₹${revenueToday}`}
            subtitle="Today's Sales"
            icon={<FaIndianRupeeSign />}
            color="#10b981"
            onClick={() => navigate("/orders")}
          />
        )}

        {showTables && (
          <HeroCard
            title="Tables"
            value={`${occupiedTables}/${tables.length}`}
            subtitle="Occupied"
            icon={<FaChair />}
            color="#6366f1"
            onClick={() => navigate("/tables")}
          />
        )}

        {showRevenueAndResources && (
          <HeroCard
            title="Menu / Staff"
            value={`${menuCount}/${staffCount}`}
            subtitle="Resources"
            icon={<FaUtensils />}
            color="#ec4899"
            onClick={() => navigate("/staff")}
          />
        )}
      </section>

      <QuickActions navigate={navigate} />

      <div style={showKitchenBoard && showTables ? css.twoCol : css.oneCol}>
        {showKitchenBoard && (
          <div style={css.panel}>
            <SectionTitle
              title="Kitchen Operations"
              subtitle="Real-time order workflow"
            />

            <KitchenBoard
              orders={activeOrders}
              cycleOrderStatus={cycleOrderStatus}
            />
          </div>
        )}

        {(showTables || showRecentActivity) && (
          <div style={css.rightCol}>
            {showTables && (
              <div style={css.panel}>
                <div style={css.panelHead}>
                  <h3 style={css.panelTitle}>Restaurant Tables</h3>
                </div>

                <div style={css.tableGrid}>
                  {tables.length === 0 ? (
                    <EmptyState text="No tables yet." />
                  ) : (
                    tables.map((table) => (
                      <TableTile
                        key={table.id}
                        table={table}
                        onSetStatus={setTableStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {showRecentActivity && (
              <div style={css.panel}>
                <div style={css.panelHead}>
                  <h3 style={css.panelTitle}>Recent Activity</h3>
                </div>

                <div style={css.feed}>
                  {recentActivity.length === 0 ? (
                    <EmptyState text="No activity yet." />
                  ) : (
                    recentActivity.map((o) => (
                      <div key={o.id} style={css.feedRow}>
                        <span style={css.feedDot}></span>

                        <span>Table {o.tableNumber} placed a new order</span>

                        <span style={css.feedTime}>{timeAgo(o.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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
  const cycle = {
    AVAILABLE: "OCCUPIED",
    OCCUPIED: "NEEDS_CLEANING",
    NEEDS_CLEANING: "AVAILABLE",
  };

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

function EmptyState({ text }) {
  return <div style={css.empty}>{text}</div>;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function timeAgo(dateStr) {
  const diffMin = Math.round((Date.now() - new Date(dateStr)) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.round(diffMin / 60)}h ago`;
}

const css = {
  page: {
    padding: 28,
    background: "var(--bg-page)",
    minHeight: "100vh",
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    color: "var(--text-muted)",
    textTransform: "uppercase",
  },
  h1: {
    fontSize: 30,
    marginTop: 8,
    marginBottom: 0,
    color: "var(--text-primary)",
    fontWeight: 700,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 20,
    marginBottom: 30,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 24,
    alignItems: "start",
  },
  oneCol: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 24,
    alignItems: "start",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  panel: {
    background: "var(--bg-surface)",
    borderRadius: 18,
    padding: 22,
    border: "1px solid var(--border-color)",
    boxShadow: "0 8px 24px var(--shadow-panel)",
  },
  panelHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  panelTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  panelHint: {
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(95px,1fr))",
    gap: 14,
  },
  tableTile: {
    padding: 18,
    borderRadius: 14,
    border: "2px solid",
    textAlign: "center",
    cursor: "pointer",
    transition: ".25s",
    fontWeight: 600,
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  feedRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--border-color)",
  },
  feedDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#2563eb",
    flexShrink: 0,
  },
  feedTime: {
    marginLeft: "auto",
    color: "var(--text-muted)",
    fontSize: 12,
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
};
