import { useEffect, useState } from "react";

function StaffModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("WAITER");

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setUsername(editingItem.username);
      setRole(editingItem.role);
    } else {
      setName("");
      setUsername("");
      setRole("WAITER");
    }
  }, [editingItem, open]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onSave({ name, username, role });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editingItem ? "Edit Staff Member" : "Add Staff Member"}</h2>

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="WAITER">Waiter</option>
            <option value="CHEF">Chef</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>

          {editingItem && (
            <p className="modal-hint">
              Changing this role changes what this person can see and do
              immediately after their next login.
            </p>
          )}

          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffModal;
