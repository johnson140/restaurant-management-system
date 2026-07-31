import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  FaMoon, FaSun, FaBuilding, FaReceipt, FaBell,
  FaDatabase, FaInfoCircle, FaSignOutAlt, FaCode, FaPen,
} from "react-icons/fa";

const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`;
const LS_KEY = "dineflow_settings";

function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const [saved, setSaved] = useState(loadLocalSettings());
  const [draft, setDraft] = useState(saved);
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  function commit(section) {
    setSaved(draft);
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
    if (section === "restaurant") setEditingRestaurant(false);
    if (section === "receipt") setEditingReceipt(false);
  }

  function cancel(section) {
    setDraft(saved);
    if (section === "restaurant") setEditingRestaurant(false);
    if (section === "receipt") setEditingReceipt(false);
  }

  async function exportCsv(type) {
    setExportStatus(`Exporting ${type}...`);
    try {
      const res = await fetch(`${API_BASE}/${type}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.length) {
        setExportStatus(`No ${type} to export.`);
        return;
      }
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`${type} exported.`);
    } catch {
      setExportStatus(`Export failed for ${type}.`);
    }
  }

  return (
    <div style={css.page}>
      <PageHeader eyebrow="PREFERENCES" title="Settings" />

      <Section icon={<FaMoon />} title="Appearance">
        <Row label="Dark Mode" sub="Switch between light and dark theme" action={
          <button style={css.toggleBtn} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        } />
      </Section>

      <Section
        icon={<FaBuilding />}
        title="Restaurant Information"
        headerAction={!editingRestaurant && (
          <button style={css.editBtn} onClick={() => setEditingRestaurant(true)}><FaPen /> Edit</button>
        )}
      >
        <div style={css.grid2}>
          <LabeledField label="Restaurant Name" value={draft.restaurantName} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, restaurantName: v })} />
          <LabeledField label="Phone" value={draft.phone} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, phone: v })} />
          <LabeledField label="Address" value={draft.address} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, address: v })} />
          <LabeledField label="GST/VAT Number" value={draft.gst} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, gst: v })} />
          <LabeledField label="Currency Symbol" value={draft.currency || "₹"} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, currency: v })} />
          <LabeledField label="Tax %" value={draft.taxPercent} editing={editingRestaurant}
            onChange={(v) => setDraft({ ...draft, taxPercent: v })} />
        </div>
        {editingRestaurant && (
          <div style={css.editActions}>
            <button style={css.btn} onClick={() => commit("restaurant")}>Save</button>
            <button style={css.btnGhost} onClick={() => cancel("restaurant")}>Cancel</button>
          </div>
        )}
        <div style={css.note}>Saved locally for now — move to a backend settings table when ready.</div>
      </Section>

      <Section
        icon={<FaReceipt />}
        title="Receipt Settings"
        headerAction={!editingReceipt && (
          <button style={css.editBtn} onClick={() => setEditingReceipt(true)}><FaPen /> Edit</button>
        )}
      >
        <LabeledField label="Footer Message" value={draft.receiptFooter || "Thank you for dining with us!"}
          editing={editingReceipt} onChange={(v) => setDraft({ ...draft, receiptFooter: v })} />
        <CheckboxRow label="Show QR verification code" checked={draft.showQr !== false}
          disabled={!editingReceipt} onChange={(v) => setDraft({ ...draft, showQr: v })} />
        {editingReceipt && (
          <div style={css.editActions}>
            <button style={css.btn} onClick={() => commit("receipt")}>Save</button>
            <button style={css.btnGhost} onClick={() => cancel("receipt")}>Cancel</button>
          </div>
        )}
      </Section>

      <Section icon={<FaBell />} title="Notifications">
        <CheckboxRow label="Enable sound notifications" checked={saved.soundEnabled !== false}
          onChange={(v) => { const u = { ...saved, soundEnabled: v }; setSaved(u); setDraft(u); localStorage.setItem(LS_KEY, JSON.stringify(u)); }} />
        <CheckboxRow label="Enable toast notifications" checked={saved.toastEnabled !== false}
          onChange={(v) => { const u = { ...saved, toastEnabled: v }; setSaved(u); setDraft(u); localStorage.setItem(LS_KEY, JSON.stringify(u)); }} />
      </Section>

      <Section icon={<FaDatabase />} title="Data Export">
        <div style={css.exportRow}>
          <button style={css.btn} onClick={() => exportCsv("orders")}>Export Orders</button>
          <button style={css.btn} onClick={() => exportCsv("ingredients")}>Export Inventory</button>
          <button style={css.btn} onClick={() => exportCsv("staff")}>Export Staff</button>
        </div>
        {exportStatus && <div style={css.status}>{exportStatus}</div>}
      </Section>

      <Section icon={<FaInfoCircle />} title="System Information">
        <Row label="Version" sub="v1.0.0" />
        <Row label="Frontend" sub="React + Vite" />
        <Row label="Backend" sub="Spring Boot" />
        <Row label="Database" sub="MySQL" />
      </Section>

      <Section icon={<FaCode />} title="About">
        <Row label="Restaurant Management System" sub="Developed by Baraka Johnson — Poornima University, MCA AI & Data Science, 2026" />
      </Section>

      <button style={css.logoutBtn} onClick={logout}>
        <FaSignOutAlt /> Log Out
      </button>
    </div>
  );
}

function Section({ icon, title, headerAction, children }) {
  return (
    <Card>
      <div style={css.sectionHead}>
        <h3 style={css.sectionTitle}>{icon} {title}</h3>
        {headerAction}
      </div>
      <div style={css.sectionBody}>{children}</div>
    </Card>
  );
}

function Row({ label, sub, action }) {
  return (
    <div style={css.row}>
      <div>
        <div style={css.rowLabel}>{label}</div>
        {sub && <div style={css.rowSub}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function LabeledField({ label, value, editing, onChange }) {
  return (
    <div style={css.field}>
      <label style={css.fieldLabel}>{label}</label>
      {editing ? (
        <input style={css.input} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div style={css.readonlyValue}>{value || <span style={{ opacity: 0.5 }}>Not set</span>}</div>
      )}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange, disabled }) {
  return (
    <label style={{ ...css.checkboxRow, opacity: disabled ? 0.6 : 1 }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "var(--space-5)" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 10, margin: 0, color: "var(--text-primary)" },
  sectionBody: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontWeight: 700, color: "var(--text-primary)" },
  rowSub: { fontSize: 13, color: "var(--text-muted)" },
  toggleBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 600, cursor: "pointer" },
  editBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-page)", color: "var(--text-primary)", fontSize: 14 },
  readonlyValue: { padding: "10px 14px", borderRadius: 10, background: "var(--bg-page)", color: "var(--text-primary)", fontSize: 14, border: "1px solid transparent" },
  btn: { padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--color-primary)", color: "white", fontWeight: 600, cursor: "pointer" },
  btnGhost: { padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" },
  status: { fontSize: 13, color: "var(--text-muted)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, color: "var(--text-muted)", fontWeight: 600 },
  editActions: { display: "flex", gap: 10, marginTop: 4 },
  note: { fontSize: 12, color: "var(--text-muted)", marginTop: 10, fontStyle: "italic" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-primary)" },
  exportRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  logoutBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "14px", borderRadius: 12, border: "1px solid var(--border-color)",
    background: "transparent", color: "#ef4444", fontWeight: 700, cursor: "pointer",
  },
};