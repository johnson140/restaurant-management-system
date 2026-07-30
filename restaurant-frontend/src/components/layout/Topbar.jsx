import {
  FaSearch, FaBell, FaChevronDown, FaSignOutAlt,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/axios";

const HEADER_BY_ROLE = {
  ADMIN: { eyebrow: "Restaurant Management Platform", title: "Dashboard" },
  CHEF: { eyebrow: "Kitchen", title: "Kitchen Queue" },
  WAITER: { eyebrow: "Floor", title: "Service Board" },
  CASHIER: { eyebrow: "Front Desk", title: "Cashier" },
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [reviews, setReviews] = useState([]);
  const debounceRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";
  const header = HEADER_BY_ROLE[user?.role] || HEADER_BY_ROLE.ADMIN;
  const unreadCount = reviews.filter((r) => !r.reviewRead).length;

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/orders/reviews")
      .then((res) => setReviews(res.data))
      .catch(console.error);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim().toLowerCase()), 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, isAdmin]);

  async function runSearch(q) {
    try {
      const safe = (promise) =>
        promise.then((res) => res.data).catch(() => []);

      const [menu, staff, inventory] = await Promise.all([
        safe(api.get("/menu")),
        safe(api.get("/staff")),
        safe(api.get("/inventory")),
      ]);

      const hits = [
        ...menu
          .filter((m) => m.name?.toLowerCase().includes(q))
          .map((m) => ({
            label: m.name,
            type: "Menu",
            path: "/menu",
          })),

        ...staff
          .filter(
            (s) =>
              s.name?.toLowerCase().includes(q) ||
              s.username?.toLowerCase().includes(q)
          )
          .map((s) => ({
            label: s.name || s.username,
            type: "Staff",
            path: "/staff",
          })),

        ...inventory
          .filter((i) => i.name?.toLowerCase().includes(q))
          .map((i) => ({
            label: i.name,
            type: "Ingredient",
            path: "/inventory",
          })),
      ];

      setResults(hits);
      setShowResults(true);
    } catch (e) {
      console.error(e);
      setResults([]);
    }
  }

  function goTo(path) {
    navigate(path);
    setShowResults(false);
    setQuery("");
  }

  async function openReview(review) {
    try {
      await api.patch(`/orders/${review.id}/review/read`);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div>
          <div style={styles.small}>{header.eyebrow}</div>
          <h2 style={styles.title}>{header.title}</h2>
        </div>

        {isAdmin && (
          <div style={styles.searchWrap}>
            <div style={styles.search}>
              <FaSearch color="var(--text-muted)" />
              <input
                placeholder="Search orders, menu, staff, ingredients..."
                style={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
              />
            </div>

            {showResults && results.length > 0 && (
              <div style={styles.resultsBox}>
                {results.map((r, i) => (
                  <div key={i} style={styles.resultRow} onMouseDown={() => goTo(r.path)}>
                    <span>{r.label}</span>
                    <span style={styles.resultTag}>{r.type}</span>
                  </div>
                ))}
              </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && (
              <div style={styles.resultsBox}>
                <div style={{ ...styles.resultRow, cursor: "default" }}>No matches found</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.right}>
        {isAdmin && (
          <div style={styles.profileWrap}>
            <IconButton onClick={() => setNotifOpen((p) => !p)}>
              <FaBell />
              {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </IconButton>

            {notifOpen && (
              <div style={{ ...styles.dropdown, minWidth: 280, maxHeight: 360, overflowY: "auto" }}>
                <div style={styles.dropdownHeader}>Customer Reviews</div>
                {reviews.length === 0 ? (
                  <div style={styles.notifRow}>No reviews yet</div>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        ...styles.notifRow,
                        background: r.reviewRead ? "transparent" : "var(--bg-page)",
                        cursor: "pointer",
                      }}
                      onClick={() => openReview(r)}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} — Table {r.tableNumber}
                      </div>
                      {r.reviewComment && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                          {r.reviewComment}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div style={styles.profileWrap}>
          <div style={styles.profile} onClick={() => setMenuOpen((p) => !p)}>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 30 },
  left: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 20, minWidth: 0 },
  small: { fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: 1 },
  title: { margin: 0, fontSize: 30, fontWeight: 800, color: "var(--text-primary)" },
  searchWrap: { position: "relative", width: "100%", maxWidth: 430, minWidth: 200 },
  search: { display: "flex", alignItems: "center", gap: 12, background: "var(--bg-surface)", padding: "14px 18px", borderRadius: 16, boxShadow: "0 10px 30px var(--shadow-panel)" },
  input: { border: "none", outline: "none", fontSize: 15, width: "100%", background: "transparent", color: "var(--text-primary)" },
  resultsBox: { position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--bg-surface)", borderRadius: 12, boxShadow: "0 10px 30px var(--shadow-panel)", border: "1px solid var(--border-color)", overflow: "hidden", zIndex: 20 },
  resultRow: { display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: 14, color: "var(--text-primary)", cursor: "pointer", borderBottom: "1px solid var(--border-color)" },
  resultTag: { fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" },
  right: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 18 },
  icon: { width: 48, height: 48, border: "none", borderRadius: 15, background: "var(--bg-surface)", cursor: "pointer", fontSize: 17, position: "relative", boxShadow: "0 10px 30px var(--shadow-panel)", color: "var(--text-primary)" },
  badge: { position: "absolute", top: 8, right: 8, background: "#ef4444", color: "white", fontSize: 10, padding: "1px 5px", borderRadius: 20 },
  profile: { display: "flex", alignItems: "center", gap: 12, background: "var(--bg-surface)", padding: "10px 14px", borderRadius: 18, boxShadow: "0 10px 30px var(--shadow-panel)", cursor: "pointer" },
  profileWrap: { position: "relative" },
  dropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-surface)", borderRadius: 12, boxShadow: "0 10px 30px var(--shadow-panel)", border: "1px solid var(--border-color)", overflow: "hidden", zIndex: 10, minWidth: 140 },
  dropdownHeader: { padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" },
  notifRow: { padding: "12px 16px", fontSize: 13, color: "var(--text-primary)" },
  dropdownItem: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" },
  avatar: { width: 46, height: 46, borderRadius: "50%" },
  name: { fontWeight: 700, color: "var(--text-primary)" },
  role: { fontSize: 12, color: "var(--text-muted)" },
};