// components/modals/StaffModal.jsx — full file
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

function StaffModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("WAITER");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setUsername(editingItem.username);
      setPhoneNumber(editingItem.phoneNumber || "");
      setRole(editingItem.role);
    } else {
      setName("");
      setUsername("");
      setPhoneNumber("");
      setRole("WAITER");
    }
    setPassword("");
  }, [editingItem, open]);

  const isCreating = !editingItem;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        username,
        phoneNumber,
        role,
        ...(password ? { password } : {}),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "Edit Staff Member" : "Add Staff Member"}>
      <form onSubmit={submit} style={css.form}>
        <div style={css.field}>
          <label style={css.label}>Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={css.input} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={css.input} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>Phone number</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={css.input} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>
            {isCreating ? "Password" : "New password (leave blank to keep current)"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={css.input}
            required={isCreating}
            autoComplete="new-password"
          />
        </div>

        <div style={css.field}>
          <label style={css.label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={css.input}>
            <option value="WAITER">Waiter</option>
            <option value="CHEF">Chef</option>
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {editingItem && (
          <p style={css.hint}>
            Changing this role changes what this person can see and do immediately after their next login.
          </p>
        )}

        <div style={css.actions}>
          <Button type="submit" loading={saving}>Save</Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

const css = {
  form: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-muted)" },
  input: {
    padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
    background: "var(--bg-page)", color: "var(--text-primary)", fontSize: "var(--font-size-base)",
  },
  hint: { fontSize: "var(--font-size-xs)", color: "var(--text-muted)", fontStyle: "italic" },
  actions: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" },
};

export default StaffModal;