// pages/admin/Analytics.jsx — new file
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { FaClipboardList, FaIndianRupeeSign, FaChair, FaChartLine } from "react-icons/fa6";

const API_BASE = "http://localhost:8080";

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error);
  }, []);

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === dayStr);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
    };
  });

  const totalRevenue = last7.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = last7.reduce((s, d) => s + d.count, 0);
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const maxCount = Math.max(1, ...last7.map((d) => d.count));

  return (
    <div style={css.page}>
      <PageHeader eyebrow="INSIGHTS" title="Analytics" subtitle="Last 7 days" />

      <div style={css.statRow}>
        <Stat icon={<FaClipboardList />} label="Orders (7d)" value={totalOrders} />
        <Stat icon={<FaIndianRupeeSign />} label="Revenue (7d)" value={`₹${totalRevenue}`} />
        <Stat icon={<FaChartLine />} label="Avg Order Value" value={`₹${avgOrderValue}`} />
      </div>

      <Card>
        <h3 style={css.chartTitle}>Orders per day</h3>
        <div style={css.barRow}>
          {last7.map((d) => (
            <div key={d.label} style={css.barCol}>
              <div style={{ ...css.bar, height: `${(d.count / maxCount) * 140 || 4}px` }} />
              <div style={css.barLabel}>{d.label}</div>
              <div style={css.barValue}>{d.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <Card>
      <div style={css.statInner}>
        <div style={css.statIcon}>{icon}</div>
        <div>
          <div style={css.statValue}>{value}</div>
          <div style={css.statLabel}>{label}</div>
        </div>
      </div>
    </Card>
  );
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--space-5)", marginBottom: "var(--space-6)" },
  statInner: { display: "flex", alignItems: "center", gap: 14 },
  statIcon: { fontSize: 22, color: "var(--color-primary)" },
  statValue: { fontSize: 22, fontWeight: 800, color: "var(--text-primary)" },
  statLabel: { fontSize: 12, color: "var(--text-muted)" },
  chartTitle: { margin: "0 0 20px", color: "var(--text-primary)" },
  barRow: { display: "flex", alignItems: "flex-end", gap: 16, height: 180 },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 },
  bar: { width: "60%", background: "var(--color-primary)", borderRadius: "6px 6px 0 0", transition: "height .3s ease" },
  barLabel: { fontSize: 12, color: "var(--text-muted)" },
  barValue: { fontSize: 12, fontWeight: 700, color: "var(--text-primary)" },
};