import { getFoodImage } from "../utils/menuImages";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8080";

export default function CustomerOrderPage() {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [screen, setScreen] = useState("MENU");

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (screen === "MENU" || !table) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/orders/table/${table.tableNumber}`
        );

        if (!response.ok) return;

        const latest = await response.json();

        setCurrentOrder(latest);

        switch (latest.status) {

            case "PAYMENT_PENDING":
                setScreen("PAYMENT");
                break;

            case "PAID":
                setScreen("REVIEW");
                break;

            default:
                setScreen("TRACKING");
        }

      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [screen, table]);

  async function loadPage() {
    try {
      if (!token) {
        throw new Error("Invalid QR Code.");
      }

      const [tableRes, menuRes] = await Promise.all([
        fetch(`${API_BASE}/tables/token/${token}`),
        fetch(`${API_BASE}/menu`)
      ]);

      if (!tableRes.ok) {
        throw new Error("Table not found.");
      }

      if (!menuRes.ok) {
        throw new Error("Unable to load menu.");
      }

      const tableData = await tableRes.json();
      const menuData = await menuRes.json();

      setTable(tableData);

      try {

          const latestOrderResponse = await fetch(
              `${API_BASE}/orders/table/${tableData.tableNumber}`
          );

          if (latestOrderResponse.ok) {

              const latestOrder = await latestOrderResponse.json();

              const activeStatuses = [
                  "PENDING",
                  "PREPARING",
                  "READY",
                  "SERVED",
                  "PAYMENT_PENDING"
              ];

              if (activeStatuses.includes(latestOrder.status)) {

                  setCurrentOrder(latestOrder);

                  switch (latestOrder.status) {

                      case "PENDING":
                      case "PREPARING":
                      case "READY":
                      case "SERVED":
                          setScreen("TRACKING");
                          break;

                      case "PAYMENT_PENDING":
                          setScreen("PAYMENT");
                          break;

                      case "PAID":
                          setScreen("REVIEW");
                          break;

                      default:
                          setScreen("MENU");
                  }
              }

          }

      } catch (e) {
          console.log("No active order.");
      }

      const availableItems = menuData.filter(
        (item) => item.available === true
      );

      setMenuItems(availableItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const cats = ["All"];

    menuItems.forEach((item) => {
      if (
        item.category &&
        !cats.includes(item.category)
      ) {
        cats.push(item.category);
      }
    });

    return cats;
  }, [menuItems]);

  const visibleItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter(
          (item) => item.category === selectedCategory
        );

  function increase(id) {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  }

  function decrease(id) {
    setCart((prev) => {
      const copy = { ...prev };

      if (!copy[id]) return copy;

      copy[id]--;

      if (copy[id] <= 0) {
        delete copy[id];
      }

      return copy;
    });
  }

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find(
        (m) => m.id === Number(id)
      );

      return {
        ...item,
        quantity: qty
      };
    });
  }, [cart, menuItems]);

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  async function placeOrder() {
    if (cartItems.length === 0) {
      alert("Cart is empty.");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(
        `${API_BASE}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            tableNumber: table.tableNumber,
            customerName,
            customerPhone,
            paymentMethod,

            items: cartItems.map((item) => ({
              menuItemId: item.id,
              quantity: item.quantity
            }))
          })
        }
      );

      if (!response.ok) {
        throw new Error("Order failed.");
      }

      const result = await response.json();

      setCurrentOrder(result);
      setScreen("TRACKING");

      setCart({});
    } catch (err) {
      alert(err.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Restaurant...
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loading}>
        {error}
      </div>
    );
  }

  if (screen === "PAYMENT" && currentOrder) {

    return (

        <div style={styles.successPage}>

            <h1>Payment</h1>

            <h2>
                ₹{currentOrder.totalAmount}
            </h2>

            <p>
                Choose your payment method.
            </p>

            <select
                value={paymentMethod}
                onChange={(e)=>
                    setPaymentMethod(e.target.value)
                }
                style={styles.input}
            >
                <option value="CASH">
                    Cash
                </option>

                <option value="UPI">
                    UPI
                </option>

                <option value="CARD">
                    Card
                </option>

            </select>

            <button
                style={styles.primaryButton}
            >
                Pay Now
            </button>

            <p
                style={{
                    marginTop:20,
                    color:"#888"
                }}
            >
                Waiting for cashier confirmation...
            </p>

        </div>

    );

  }

  if (screen === "TRACKING" && currentOrder) {

    return (
        <div style={styles.successPage}>

            <h1>Order Status</h1>

            <h2>
                Table {table.tableNumber}
            </h2>

            <h3>{currentOrder.status}</h3>

            <p>
                Estimated preparation time:
                {" "}
                {currentOrder.estimatedPreparationTime}
                {" "}
                minutes
            </p>

            {currentOrder.status === "PENDING" && (
                <p>
                    ✅ Your order has been received.
                </p>
            )}

            {currentOrder.status === "PREPARING" && (
                <p>
                    👨‍🍳 Our chefs have started preparing your meal.
                </p>
            )}

            {currentOrder.status === "READY" && (
                <p>
                    🍽 Your meal is ready.
                    A waiter is bringing it.
                </p>
            )}

            {currentOrder.status === "SERVED" && (
                <button
                    style={styles.primaryButton}
                    onClick={async () => {

                        await fetch(
                            `${API_BASE}/orders/${currentOrder.id}/status`,
                            {
                                method: "PATCH",
                                headers: {
                                    "Content-Type":"application/json"
                                },
                                body: JSON.stringify({
                                    status:"PAYMENT_PENDING"
                                })
                            }
                        );

                        setScreen("PAYMENT");

                    }}
                >
                    I'm Ready To Pay
                </button>
            )}

        </div>
    );
  }

  return (
    <div style={styles.page}>

      <header style={styles.header}>

        <div>

          <h1 style={styles.restaurant}>
            Restaurant Menu
          </h1>

          <p style={styles.table}>
            Table {table.tableNumber}
          </p>

        </div>

      </header>

      <section style={styles.customerCard}>

        <input
          placeholder="Your Name"
          value={customerName}
          onChange={(e) =>
            setCustomerName(e.target.value)
          }
          style={styles.input}
        />

        <input
          placeholder="Phone Number"
          value={customerPhone}
          onChange={(e) =>
            setCustomerPhone(e.target.value)
          }
          style={styles.input}
        />

      </section>

      <div style={styles.categoryRow}>

        {categories.map((category) => (

          <button
            key={category}
            style={{
              ...styles.categoryButton,

              background:
                selectedCategory === category
                  ? "#ff6b00"
                  : "#ffffff",

              color:
                selectedCategory === category
                  ? "#ffffff"
                  : "#333333"
            }}
            onClick={() =>
              setSelectedCategory(category)
            }
          >
            {category}
          </button>

        ))}

      </div>

      <div style={styles.grid}>

        {visibleItems.map((item) => {

          const quantity =
            cart[item.id] || 0;

          return (

            <div
              key={item.id}
              style={styles.card}
            >

              <img
                  src={getFoodImage(item.name)}
                  alt={item.name}
                  style={styles.image}
              />


              <h3>
                {item.name}
              </h3>

              <p style={styles.price}>
                ₹{item.price}
              </p>

              <p style={styles.description}>
                {item.description ||
                  "Freshly prepared by our chefs."}
              </p>

              {quantity === 0 ? (

                <button
                  style={styles.primaryButton}
                  onClick={() =>
                    increase(item.id)
                  }
                >
                  Add To Cart
                </button>

              ) : (

                <div style={styles.quantityBox}>

                  <button
                    style={styles.qtyButton}
                    onClick={() =>
                      decrease(item.id)
                    }
                  >
                    -
                  </button>

                  <span>
                    {quantity}
                  </span>

                  <button
                    style={styles.qtyButton}
                    onClick={() =>
                      increase(item.id)
                    }
                  >
                    +
                  </button>

                </div>

              )}

            </div>

          );

        })}

      </div>

      {totalItems > 0 && (
        <div style={styles.cartBar}>

          <div>

            <div style={{ fontWeight: 700 }}>
              {totalItems} item{totalItems > 1 ? "s" : ""}
            </div>

            <div>
              ₹{totalPrice.toFixed(2)}
            </div>

          </div>

          <div
            style={{
              display: "flex",
              gap: 10
            }}
          >

            <input
              placeholder="Your name"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              style={{
                padding: 10,
                borderRadius: 8,
                border: "none"
              }}
            />

            <input
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) =>
                setCustomerPhone(e.target.value)
              }
              style={{
                padding: 10,
                borderRadius: 8,
                border: "none"
              }}
            />

            <button
              style={styles.checkoutButton}
              disabled={placingOrder}
              onClick={placeOrder}
            >
              {placingOrder
                ? "Placing..."
                : "Checkout"}
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    paddingBottom: 120,
    fontFamily: "Arial, sans-serif",
    background: "#fafafa",
    minHeight: "100vh"
  },

  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    fontWeight: 600
  },

  successPage: {
    maxWidth: 500,
    margin: "100px auto",
    textAlign: "center",
    padding: 30
  },

  header: {
    background: "#ff6b00",
    color: "#fff",
    padding: 30,
    borderRadius: 15,
    marginBottom: 25
  },

  restaurant: {
    margin: 0,
    fontSize: 34
  },

  table: {
    marginTop: 10,
    opacity: 0.9,
    fontSize: 18
  },

  customerCard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 15,
    marginBottom: 25
  },

  input: {
    padding: 14,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 16
  },

  categoryRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    marginBottom: 25
  },

  categoryButton: {
    border: "1px solid #ff6b00",
    borderRadius: 30,
    padding: "10px 18px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 600
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: 20
  },

  card: {
    background: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    boxShadow: "0 3px 12px rgba(0,0,0,.08)"
  },

  image: {
    width: "100%",
    height: 190,
    objectFit: "cover"
  },

  price: {
    color: "#ff6b00",
    fontWeight: 700,
    fontSize: 22,
    marginLeft: 15
  },

  description: {
    padding: "0 15px",
    color: "#666",
    minHeight: 45
  },

  primaryButton: {
    margin: 15,
    width: "calc(100% - 30px)",
    padding: 12,
    border: "none",
    borderRadius: 10,
    background: "#ff6b00",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer"
  },

  quantityBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 15
  },

  qtyButton: {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 8,
    background: "#ff6b00",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer"
  },

  cartBar: {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(900px,95%)",
    background: "#111",
    color: "#fff",
    borderRadius: 15,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,.25)"
  },

  checkoutButton: {
    background: "#ff6b00",
    color: "#fff",
    border: "none",
    padding: "14px 30px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16
  }
};
