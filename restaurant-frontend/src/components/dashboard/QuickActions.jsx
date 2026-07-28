import {
  FaPlus,
  FaClipboardList,
  FaUtensils,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function QuickActions({ navigate }) {
  const { user } = useAuth();

  const items = [
    {
      icon: <FaPlus />,
      title: "New Order",
      color: "#2563eb",
      path: "/orders",
      roles: ["ADMIN", "CHEF", "WAITER"],
    },
    {
      icon: <FaClipboardList />,
      title: "Orders",
      color: "#10b981",
      path: "/orders",
      roles: ["ADMIN", "CHEF", "WAITER"],
    },
    {
      icon: <FaUtensils />,
      title: "Menu",
      color: "#f97316",
      path: "/menu",
      roles: ["ADMIN"],
    },
    {
      icon: <FaUsers />,
      title: "Staff",
      color: "#8b5cf6",
      path: "/staff",
      roles: ["ADMIN"],
    },
  ];

  const visibleItems = items.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <div style={styles.grid}>
      {visibleItems.map((item) => (
        <div
          key={item.title}
          style={styles.card}
          onClick={() => navigate(item.path)}
        >
          <div
            style={{
              ...styles.icon,
              background: item.color,
            }}
          >
            {item.icon}
          </div>

          <h4 style={styles.title}>{item.title}</h4>

          <p style={styles.subtitle}>Open module</p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 18,
    marginBottom: 28,
  },

  card: {
    background: "var(--bg-surface)",
    padding: 24,
    borderRadius: 22,
    cursor: "pointer",
    transition: ".25s",
    boxShadow: "0 12px 35px var(--shadow-panel)",
  },

  icon: {
    width: 54,
    height: 54,
    display: "grid",
    placeItems: "center",
    color: "white",
    fontSize: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  title: {
    margin: "0 0 4px 0",
    color: "var(--text-primary)",
  },

  subtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: 14,
  },
};
