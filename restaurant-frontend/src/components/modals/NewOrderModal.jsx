import { useEffect, useState } from "react";
import api from "@/services/axios";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { FaUtensils } from "react-icons/fa6";

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
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    if (open) {
      loadMenu();
      setCart({});
      setTableNumber("");
    }
  }, [open]);

  async function loadMenu() {
    try {
      setLoadingMenu(true);
      const res = await api.get("/menu");
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load menu", "error");
    } finally {
      setLoadingMenu(false);
    }
  }

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
    <Modal open={open} onClose={onClose} title="New Order">
      <div style={css.form}>
        <div style={css.field}>
          <label style={css.label}>Table</label>
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={css.select}
          >
            <option value="">Select a table</option>
            {tables.map((t) => (
              <option key={t.id} value={t.tableNumber}>
                Table {t.tableNumber} ({t.status})
              </option>
            ))}
          </select>
        </div>

        <div style={css.itemList}>
          {loadingMenu && (
            <p style={css.mutedText}>Loading menu...</p>
          )}

          {!loadingMenu && menuItems.length === 0 && (
            <EmptyState icon={<FaUtensils />} title="No menu items available." />
          )}

          {!loadingMenu &&
            menuItems.map((item) => (
              <div key={item.id} style={css.itemRow}>
                <div style={css.itemInfo}>
                  {/* Same veg/non-veg mark used across Menu.jsx and the
                      customer page, so waiters can tell at a glance too. */}
                  <span
                    title={item.veg ?? true ? "Veg" : "Non-Veg"}
                    style={css.dietDot(item.veg ?? true)}
                  >
                    <span style={css.dietDotInner(item.veg ?? true)} />
                  </span>
                  <div>
                    <div style={css.itemName}>{item.name}</div>
                    <div style={css.itemPrice}>₹{item.price}</div>
                  </div>
                </div>

                <div style={css.qtyControls}>
                  <button
                    type="button"
                    style={css.qtyButton}
                    onClick={() => changeQty(item.id, -1)}
                  >
                    −
                  </button>
                  <span style={css.qtyValue}>{cart[item.id] || 0}</span>
                  <button
                    type="button"
                    style={css.qtyButton}
                    onClick={() => changeQty(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div style={css.totalRow}>
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <div style={css.actions}>
          <Button block loading={submitting} onClick={submit}>
            Place Order
          </Button>
          <Button block type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const css = {
  form: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-muted)" },
  select: {
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    fontSize: "var(--font-size-base)",
  },
  itemList: {
    maxHeight: 320,
    overflowY: "auto",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "0 var(--space-4)",
  },
  mutedText: { color: "var(--text-muted)", fontStyle: "italic", padding: "var(--space-4) 0" },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--space-3) 0",
    borderBottom: "1px solid var(--border-color)",
  },
  itemInfo: { display: "flex", alignItems: "center", gap: 10 },
  itemName: { fontWeight: "var(--font-weight-bold)", color: "var(--text-primary)", fontSize: "var(--font-size-base)" },
  itemPrice: { fontSize: "var(--font-size-xs)", color: "var(--text-muted)" },
  qtyControls: { display: "flex", alignItems: "center", gap: "var(--space-3)" },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    fontSize: "var(--font-size-base)",
    cursor: "pointer",
  },
  qtyValue: { minWidth: 18, textAlign: "center", color: "var(--text-primary)" },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "var(--font-weight-bold)",
    fontSize: "var(--font-size-lg)",
    color: "var(--text-primary)",
    padding: "var(--space-2) 0",
  },
  actions: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" },
  dietDot: (isVeg) => ({
    display: "inline-flex",
    width: 14,
    height: 14,
    border: `2px solid ${isVeg ? "#0a8a0a" : "#a5291d"}`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  dietDotInner: (isVeg) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: isVeg ? "#0a8a0a" : "#a5291d",
  }),
};
