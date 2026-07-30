import { NavLink } from "react-router-dom";
import {
  FaChartPie,
  FaClipboardList,
  FaUtensils,
  FaChair,
  FaUsers,
  FaBoxes,
  FaChartLine,
  FaCog,
  FaStore,
  FaFire,
  FaConciergeBell,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

// Nav is built per-role, not filtered from one master list — a Chef's
// "home" link says Kitchen Queue, not Dashboard, because that's what it
// actually is for them.
const ITEMS_BY_ROLE = {
  ADMIN: [
    { icon: <FaChartPie />, text: "Dashboard", path: "/" },
    { icon: <FaClipboardList />, text: "Orders", path: "/orders" },
    { icon: <FaUtensils />, text: "Menu", path: "/menu" },
    { icon: <FaChair />, text: "Tables", path: "/tables" },
    { icon: <FaUsers />, text: "Staff", path: "/staff" },
    { icon: <FaBoxes />, text: "Inventory", path: "/inventory" },
    { icon: <FaChartLine />, text: "Analytics", path: "/analytics" },
    { icon: <FaCog />, text: "Settings", path: "/settings" },
  ],
  CHEF: [
    { icon: <FaFire />, text: "Kitchen Queue", path: "/" },
  ],
  WAITER: [
    { icon: <FaConciergeBell />, text: "Service Board", path: "/" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const items = ITEMS_BY_ROLE[user?.role] || [];

  return (
    <aside style={styles.sidebar}>
      <div>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <FaStore />
          </div>

          <div>
            <div style={styles.brand}>DineFlow</div>
            <div style={styles.sub}>Restaurant OS</div>
          </div>
        </div>

        <div style={styles.menu}>
          {items.map((item) => (
            <NavLink
              key={item.text}
              to={item.path}
              end={item.path === "/"}
              style={({ isActive }) => ({
                ...styles.link,
                transform: isActive ? "translateX(8px)" : "translateX(0px)",
                background: isActive
                  ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                  : "transparent",
                color: isActive ? "white" : "var(--text-secondary)",
                boxShadow: isActive
                  ? "0 15px 35px rgba(37,99,235,.35)"
                  : "none",
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>

              {item.text}
            </NavLink>
          ))}
        </div>
      </div>

      <div style={styles.user}>
              <div style={styles.avatar}>
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={styles.userName}>{user?.username || "Guest"}</div>
                <div style={styles.online}>● {user?.role || "Offline"}</div>
              </div>
            </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 280,
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    boxSizing: "border-box",
    background: "var(--bg-sidebar)",
    backdropFilter: "blur(18px)",
    borderRight: "1px solid var(--border-color-soft)",
    boxShadow: "0 0 45px var(--shadow-color)",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    marginBottom: 40,
  },

  logoIcon: {
    width: 58,
    height: 58,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    borderRadius: 18,
    background: "linear-gradient(135deg,#2563eb,#60a5fa)",
    color: "white",
    boxShadow: "0 12px 30px rgba(37,99,235,.35)",
  },

  brand: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--text-primary)",
  },

  sub: {
    color: "var(--text-muted)",
    fontSize: 13,
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  link: {
    textDecoration: "none",
    padding: "15px 18px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
    fontWeight: 600,
    transition: "all .25s ease",
  },

  user: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    borderTop: "1px solid var(--border-color)",
    paddingTop: 18,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
  },

  userName: {
    fontWeight: 700,
    color: "var(--text-primary)",
  },

  online: {
    color: "#16a34a",
    fontSize: 12,
  },
};
