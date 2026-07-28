import { useEffect, useState } from "react";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";

// ASSUMPTION FLAGGED: the POST /orders payload shape below
// ({ tableNumber, items: [{ menuItemId, quantity }] }) is inferred from
// the Order/OrderItem entity relationship, not confirmed against
// OrderRequest.java. Update the `submit()` body below once that DTO is
// shared — this is the one part of this file likely to need a fix.
export default function NewOrderModal({ open, onClose, onCreated, tables }) {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadMenu();
      setCart({});
      setTableNumber("");
    }
  }, [open]);

  async function loadMenu() {
    try {
      const res = await api.get("/menu");
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load menu", "error");
    }
  }

  if (!open) return null;

  function changeQty(itemId, delta) {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = next;
      }
      return updated;
    });
  }

  const cartEntries = Object.entries(cart);
  const total = cartEntries.reduce((sum, [itemId, qty]) => {
    const item = menuItems.find((m) => String(m.id) === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  async function submit() {
    if (!tableNumber) {
      showToast("Select a table first", "error");
      return;
    }
    if (cartEntries.length === 0) {
      showToast("Add at least one item", "error");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/orders", {
        tableNumber: Number(tableNumber),
        items: cartEntries.map(([menuItemId, quantity]) => ({
          menuItemId: Number(menuItemId),
          quantity,
        })),
      });

      showToast("Order created");
      onCreated();
    } catch (err) {
      console.error(err);
      showToast("Could not create order", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <h2>New Order</h2>

        <label style={{ display: "block", marginBottom: 12 }}>
          Table
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 6 }}
          >
            <option value="">Select a table</option>
            {tables.map((t) => (
              <option key={t.id} value={t.tableNumber}>
                Table {t.tableNumber} ({t.status})
              </option>
            ))}
          </select>
        </label>

        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: "#888" }}>₹{item.price}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={() => changeQty(item.id, -1)}>
                  −
                </button>
                <span>{cart[item.id] || 0}</span>
                <button type="button" onClick={() => changeQty(item.id, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}

          {menuItems.length === 0 && (
            <p style={{ color: "#888", fontStyle: "italic" }}>
              No menu items available.
            </p>
          )}
        </div>

        <div style={{ fontWeight: 700, marginBottom: 16 }}>
          Total: ₹{total.toFixed(2)}
        </div>

        <div className="modal-buttons">
          <button type="button" disabled={submitting} onClick={submit}>
            {submitting ? "Placing order..." : "Place Order"}
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
