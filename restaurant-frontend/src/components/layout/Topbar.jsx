import {
  FaSearch,
  FaBell,
  FaMoon,
  FaSun,
  FaEnvelope,
  FaChevronDown,
  FaSignOutAlt,
} from "react-icons/fa";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div>
          <div style={styles.small}>Restaurant Management Platform</div>
          <h2 style={styles.title}>Dashboard</h2>
        </div>

        <div style={styles.search}>
          <FaSearch color="var(--text-muted)" />

          <input
            placeholder="Search orders, menu, staff..."
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.right}>
        <IconButton>
          <FaEnvelope />
        </IconButton>

        <IconButton>
          <FaBell />
          <span style={styles.badge}>4</span>
        </IconButton>

        <IconButton onClick={toggleTheme}>
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </IconButton>

        <div style={styles.profileWrap}>
          <div
            style={styles.profile}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${user?.username || "User"}&background=2563eb&color=fff`}
              alt=""
              style={styles.avatar}
            />

            <div>
              <div style={styles.name}>{user?.username || "Guest"}</div>
              <div style={styles.role}>{user?.role || ""}</div>
            </div>

            <FaChevronDown color="var(--text-muted)" />
          </div>

          {menuOpen && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem} onClick={logout}>
                <FaSignOutAlt /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button style={styles.icon} onClick={onClick}>
      {children}
    </button>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 30,
  },

  left: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    minWidth: 0,
  },

  small: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    letterSpacing: 1,
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    color: "var(--text-primary)",
  },

  search: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--bg-surface)",
    padding: "14px 18px",
    borderRadius: 16,
    width: "100%",
    maxWidth: 430,
    minWidth: 200,
    boxShadow: "0 10px 30px var(--shadow-panel)",
  },

  input: {
    border: "none",
    outline: "none",
    fontSize: 15,
    width: "100%",
    background: "transparent",
    color: "var(--text-primary)",
  },

  right: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
  },

  icon: {
    width: 48,
    height: 48,
    border: "none",
    borderRadius: 15,
    background: "var(--bg-surface)",
    cursor: "pointer",
    fontSize: 17,
    position: "relative",
    boxShadow: "0 10px 30px var(--shadow-panel)",
    color: "var(--text-primary)",
  },

  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "#ef4444",
    color: "white",
    fontSize: 10,
    padding: "1px 5px",
    borderRadius: 20,
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--bg-surface)",
    padding: "10px 14px",
    borderRadius: 18,
    boxShadow: "0 10px 30px var(--shadow-panel)",
    cursor: "pointer",
  },

  profileWrap: {
    position: "relative",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "var(--bg-surface)",
    borderRadius: 12,
    boxShadow: "0 10px 30px var(--shadow-panel)",
    border: "1px solid var(--border-color)",
    overflow: "hidden",
    zIndex: 10,
    minWidth: 140,
  },

  dropdownItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "none",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
  },

  name: {
    fontWeight: 700,
    color: "var(--text-primary)",
  },

  role: {
    fontSize: 12,
    color: "var(--text-muted)",
  },
};
