import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroCard from "@/components/dashboard/HeroCard";
import KitchenBoard from "@/components/dashboard/KitchenBoard";
import SectionTitle from "@/components/dashboard/SectionTitle";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import TableStatusTile from "@/components/ui/TableStatusTile";
import { greetingForNow, timeSince } from "@/utils/statusMeta";

import {
  FaClipboardList,
  FaIndianRupeeSign,
  FaChair,
  FaUtensils,
  FaClipboard,
  FaChartLine,
  FaUsers
} from "react-icons/fa6";

// Was hardcoded to "http://localhost:8080" — broke Staff/Tables/Menu
// counts in production because the deployed site would try to call
// itself on port 8080 instead of the Railway backend. Same bug class
// as the login/axios/CustomerOrderPage fixes earlier.
const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`;

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
    const headers = { Authorization: `Bearer ${token}` };

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
      <PageHeader
        eyebrow="OVERVIEW"
        title={`Good ${timeOfDay()}, let's see how service is going`}
      />

      <section style={css.heroGrid}>
        <HeroCard
          title="Orders Today"
          value={ordersToday.length}
          subtitle={`${activeOrders.length} active`}
          icon={<FaClipboardList />}
          color="var(--color-accent-customer)"
          onClick={() => navigate("/orders")}
        />

      {showRevenueAndResources && (
                <>
                  <HeroCard
                    title="Menu Items"
                    value={menuCount}
                    subtitle="Tap to manage"
                    icon={<FaUtensils />}
                    color="var(--color-info)"
                    onClick={() => navigate("/menu")}
                  />
                  <HeroCard
                    title="Staff"
                    value={staffCount}
                    subtitle="Tap to manage"
                    icon={<FaUsers />}
                    color="var(--color-warning, #f59e0b)"
                    onClick={() => navigate("/staff")}
                  />
                </>
              )}

        {showTables && (
          <HeroCard
            title="Tables"
            value={`${occupiedTables}/${tables.length}`}
            subtitle="Occupied"
            icon={<FaChair />}
            color="var(--color-primary)"
            onClick={() => navigate("/tables")}
          />
        )}


      </section>

      <div style={showKitchenBoard && showTables ? css.twoCol : css.oneCol}>
        {showKitchenBoard && (
          <Card>
            <SectionTitle title="Kitchen Operations" subtitle="Real-time order workflow" />
              <KitchenBoard orders={activeOrders} onSelectOrder={(o) => console.log("TODO: open detail modal for order", o.id)} />
          </Card>
        )}

        {(showTables || showRecentActivity) && (
          <div style={css.rightCol}>
            {showTables && (
              <Card>
                <div style={css.panelHead}>
                  <h3 style={css.panelTitle}>Restaurant Tables</h3>
                </div>

                <div style={css.tableGrid}>
                  {tables.length === 0 ? (
                    <EmptyState icon={<FaChair />} title="No tables yet." />
                  ) : (
                    tables.map((table) => (
                      <TableStatusTile
                        key={table.id}
                        table={table}
                        onSetStatus={setTableStatus}
                      />
                    ))
                  )}
                </div>
              </Card>
            )}

            {showRecentActivity && (
              <Card>
                <div style={css.panelHead}>
                  <h3 style={css.panelTitle}>Recent Activity</h3>
                </div>

                <div style={css.feed}>
                  {recentActivity.length === 0 ? (
                    <EmptyState icon={<FaChartLine />} title="No activity yet." />
                  ) : (
                    recentActivity.map((o) => (
                      <div key={o.id} style={css.feedRow}>
                        <span style={css.feedDot}></span>
                        <span>Table {o.tableNumber} placed a new order</span>
                        <span style={css.feedTime}>{timeSince(o.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "var(--space-5)",
    marginBottom: "var(--space-8)",
  },
  twoCol: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)", alignItems: "start" },
  oneCol: { display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", alignItems: "start" },
  rightCol: { display: "flex", flexDirection: "column", gap: "var(--space-6)" },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" },
  panelTitle: { margin: 0, fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--text-primary)" },
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(95px,1fr))", gap: "var(--space-4)" },
  feed: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  feedRow: {
    display: "flex", alignItems: "center", gap: "var(--space-3)",
    fontSize: "var(--font-size-sm)", paddingBottom: "var(--space-3)",
    borderBottom: "1px solid var(--border-color)",
  },
  feedDot: { width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 },
  feedTime: { marginLeft: "auto", color: "var(--text-muted)", fontSize: "var(--font-size-xs)" },
};
