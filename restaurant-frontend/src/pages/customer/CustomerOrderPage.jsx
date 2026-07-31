import { getFoodImage } from "@/utils/menuImages";
import { useEffect, useMemo, useRef, useState } from "react";
import paymentSuccess from "@/assets/sounds/updatepelgo-success-221935.mp3";

// Same env-var fix as services/axios.js — this file was still on the
// old `http://${hostname}:8080` pattern, which is why it would have
// broken in production exactly like the login page did (trying to hit
// <your-vercel-domain>:8080 instead of Railway). Falls back to the old
// LAN-IP behavior only if the env var isn't set, so local dev on your
// phone still works unchanged.
const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`;

// States where the backend order status can still change and the page
// needs to react to it. REVIEW/RATING/THANK_YOU are all *after* the order
// is finished — polling there was the bug: the backend kept returning the
// same PAID order forever, and the switch in the poll handler kept
// snapping the screen back to REVIEW every 3 seconds.
const POLLABLE_SCREENS = ["TRACKING", "PAYMENT", "PAYMENT_PENDING"];

// Two-tone "success" chime, built with the Web Audio API so there's no
// external mp3/wav file to host or bundle. Fires right as the tick mark
// finishes drawing.
//
// IMPORTANT: browsers only allow AudioContext to actually produce sound
// if it was created (or resumed) during a direct user gesture (a click,
// tap, etc). If you create a *new* AudioContext inside a setTimeout that
// fires later, the browser no longer considers it tied to that gesture
// and it silently stays suspended — no sound, no error. So we create the
// context once, at the moment the user clicks "Pay Now", and just reuse
// it here.
function playSuccessSound(ctx) {
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    [660, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const start = now + i * 0.12;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {
    console.log("Audio not available:", e);
  }
}

// Standard FSSAI-style veg/non-veg mark: a square outline with a filled
// dot inside — green for veg, brown/red for non-veg. Familiar to Indian
// customers rather than a custom-invented indicator.
function VegDot({ isVeg }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 16,
        height: 16,
        border: `2px solid ${isVeg ? "#0a8a0a" : "#a5291d"}`,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isVeg ? "#0a8a0a" : "#a5291d",
        }}
      />
    </span>
  );
}

export default function CustomerOrderPage() {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [dietMode, setDietMode] = useState("VEG"); // "VEG" | "NONVEG"
  const [pendingDietMode, setPendingDietMode] = useState(null); // confirmation popup target
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [screen, setScreen] = useState("MENU");
  const [showReceipt, setShowReceipt] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Holds the AudioContext created at the moment the user clicks
  // "Pay Now" (a real user gesture), so it's already unlocked by the
  // time the tick-chime timeout fires later.
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");

    if (urlToken) {
      loadPage(urlToken);
      return;
    }

    // No token at all means this wasn't opened via a real table QR (the
    // kiosk display always encodes one). Table selection now happens on
    // the kiosk screen, not here — this page just needs a token handed
    // to it.
    setError("Please scan the QR code displayed at the entrance to get started.");
    setLoading(false);
  }, []);

  // Play the success chime once, timed to land just as the tick mark
  // finishes drawing (the tick's CSS animation starts at 0.9s and takes
  // 0.6s, so ~1.4s lines it up). Reuses the AudioContext created on the
  // "Pay Now" click instead of making a fresh one here.
  useEffect(() => {
    if (screen !== "PAYMENT_PENDING") return;

    const timeout = setTimeout(() => {
      playSuccessSound(audioCtxRef.current);
    }, 1400);

    return () => clearTimeout(timeout);
  }, [screen]);

  // Fixed polling: only runs while the session is in a state that can
  // still change server-side. Once the customer moves past payment
  // (REVIEW/RATING/THANK_YOU), this effect doesn't even attach an
  // interval, so a stale PAID order can never resurrect the receipt.
  useEffect(() => {
    if (!POLLABLE_SCREENS.includes(screen) || !table) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/orders/table/${table.tableNumber}`
        );

        if (!response.ok) return;

        const latest = await response.json();

        setCurrentOrder(latest);

        switch (latest.status) {
          case "PAYMENT_REQUESTED":
            // Don't yank the customer backward. If they've already moved
            // on to the "pending confirmation" animation screen, leave
            // them there instead of bouncing them back to the payment
            // method picker.
            setScreen((prev) => (prev === "PAYMENT_PENDING" ? prev : "PAYMENT"));
            break;

          case "PAID":
            if (screen !== "REVIEW") {
              const audio = new Audio(paymentSuccess);
              audio.play().catch((e) => {
                // Most browsers allow <audio> elements more leniently
                // than raw AudioContext, but it can still be blocked if
                // the page has had zero user interaction at all. Log it
                // instead of swallowing it silently so it's debuggable.
                console.log("PAID chime blocked:", e);
              });
            }

            setScreen("REVIEW");
            break;

          default:
            // Guard mirrors the PAYMENT_REQUESTED case above: if the
            // customer has already moved themselves to the payment-method
            // screen (via "I'm Ready To Pay", which is now local-only —
            // see that button's comment), don't let a poll that still
            // sees the backend status as SERVED yank them back to
            // Tracking mid-selection.
            setScreen((prev) => (prev === "PAYMENT" ? prev : "TRACKING"));
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [screen, table]);

  // Now takes the token explicitly instead of reading it from a
  // module-scope variable, since the token might come from the URL
  // immediately (per-table QR) or arrive a moment later from
  // assignTable() (generic QR).
  async function loadPage(tokenValue) {
    try {
      const [tableRes, menuRes] = await Promise.all([
        fetch(`${API_BASE}/tables/token/${tokenValue}`),
        fetch(`${API_BASE}/menu`),
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
            "PAYMENT_REQUESTED",
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

              case "PAYMENT_REQUESTED":
                setScreen("PAYMENT_PENDING");
                break;

              default:
                setScreen("MENU");
            }
          }
          // Note: a PAID order found on page load is intentionally NOT
          // resumed into REVIEW here. If someone reloads/rescans after
          // paying, they should land on a fresh menu, not a stale
          // receipt for a finished visit.
        }
      } catch (e) {
        console.log("No active order.");
      }

      const availableItems = menuData.filter((item) => item.available === true);

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
      if (item.category && !cats.includes(item.category)) {
        cats.push(item.category);
      }
    });

    return cats;
  }, [menuItems]);

  // Combined category + veg/non-veg filtering.
  const visibleItems = useMemo(() => {
    return menuItems
      .filter((item) => selectedCategory === "All" || item.category === selectedCategory)
      .filter((item) => (dietMode === "VEG" ? item.veg === true : item.veg === false));
  }, [menuItems, selectedCategory, dietMode]);

  function increase(id) {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  }

  function decrease(id) {
    setCart((prev) => {
      const copy = { ...prev };
      if (!copy[id]) return copy;
      copy[id]--;
      if (copy[id] <= 0) delete copy[id];
      return copy;
    });
  }

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === Number(id));
      return { ...item, quantity: qty };
    });
  }, [cart, menuItems]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: table.tableNumber,
          customerName,
          customerPhone,
          paymentMethod,
          items: cartItems.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

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

  // Called once the dining session is genuinely over (after rating or
  // skip). Clears everything so there's no leftover order to resurrect,
  // and now ALSO releases the table back to AVAILABLE automatically —
  // per your call, no waiter step required. Captures table?.id before
  // the state reset below clears it, and fires the release request
  // without blocking the screen transition (the customer shouldn't
  // wait on this network call to see "Thank You").
  function finishSession() {
    const tableId = table?.id;

    setCurrentOrder(null);
    setCart({});
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("CASH");
    setShowReceipt(false);
    setRating(0);
    setHoverRating(0);
    setReviewComment("");
    setScreen("THANK_YOU");

    if (tableId) {
      fetch(`${API_BASE}/tables/${tableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" }),
      }).catch((e) => {
        console.log("Could not auto-release table:", e);
      });
    }
  }

  async function submitReview() {
    setSubmittingReview(true);

    // NOTE: this assumes a POST /orders/{id}/review endpoint exists.
    // That hasn't been confirmed against your backend yet — this call is
    // wrapped so a missing endpoint doesn't block the customer from
    // finishing their session either way. Confirm/build this endpoint
    // when ready, then this becomes a real feature instead of best-effort.
    try {
      await fetch(`${API_BASE}/orders/${currentOrder.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: reviewComment }),
      });
    } catch (e) {
      console.log("Review submission skipped — endpoint not confirmed yet.");
    } finally {
      setSubmittingReview(false);
      finishSession();
    }
  }
    useEffect(() => {
      document.documentElement.removeAttribute("data-theme");
    }, []);
  // Auto-return to the menu a little while after Thank You, so the next
  // guest at this table isn't stuck looking at someone else's goodbye
  // screen. Manual button covers anyone who doesn't want to wait.
  useEffect(() => {
    if (screen !== "THANK_YOU") return;

    const timeout = setTimeout(() => {
      setScreen("MENU");
    }, 6000);

    return () => clearTimeout(timeout);
  }, [screen]);

  if (loading) {
    return <div style={styles.loading}>Loading Menu...</div>;
  }

  if (error) {
    return <div style={styles.loading}>{error}</div>;
  }

  // ---------------------------------------------------------------------
  // PAYMENT — pick a method
  // ---------------------------------------------------------------------
  if (screen === "PAYMENT" && currentOrder) {
    return (
      <div style={styles.successPage}>
        <h1>Payment</h1>
        <h2>₹{currentOrder.totalAmount}</h2>
        <p>Choose your payment method.</p>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={styles.input}
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
        </select>

        <button
          style={styles.primaryButton}
          onClick={async () => {
            // Create the AudioContext right here, inside this click
            // handler — this is the real user gesture the browser
            // requires before it will let audio actually play. We just
            // reuse this same context later when the tick-chime timeout
            // fires on the PAYMENT_PENDING screen.
            if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } else if (audioCtxRef.current.state === "suspended") {
              audioCtxRef.current.resume();
            }

            // Reflect the chosen method locally right away so the
            // animation screen and eventual receipt are never briefly
            // showing the stale "CASH" the order was created with.
            setCurrentOrder((prev) => ({ ...prev, paymentMethod }));

            // Move to the animation screen immediately — it plays while
            // the request goes out, exactly like a UPI app does.
            setScreen("PAYMENT_PENDING");

            // IMPORTANT: this now also sends paymentMethod, because the
            // order was created with a placeholder "CASH" at checkout
            // time — this is the actual moment the customer picks how
            // they're paying. The backend's PATCH /orders/{id}/status
            // needs to accept and persist this field (see backend note).
            await fetch(`${API_BASE}/orders/${currentOrder.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "PAYMENT_REQUESTED",
                paymentMethod,
              }),
            });
          }}
        >
          Pay Now
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // PAYMENT_PENDING — Paytm/UPI-style full-screen tick animation, then
  // "waiting for cashier" state. Stays here (polling continues) until the
  // backend flips the order to PAID.
  // ---------------------------------------------------------------------
  if (screen === "PAYMENT_PENDING" && currentOrder) {
    return (
      <div style={tickStyles.page}>
        <style>{tickKeyframes}</style>

        <svg viewBox="0 0 130 130" style={tickStyles.svg}>
          <circle
            cx="65"
            cy="65"
            r="58"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
          />
          <circle
            cx="65"
            cy="65"
            r="58"
            fill="none"
            stroke="#22c55e"
            strokeWidth="6"
            strokeLinecap="round"
            style={tickStyles.circleAnim}
          />
          <path
            d="M40 68 L58 86 L92 46"
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={tickStyles.tickAnim}
          />
        </svg>

        <h1 style={tickStyles.amount}>₹{currentOrder.totalAmount}</h1>
        <p style={tickStyles.method}>Paid via {paymentMethod}</p>

        <div style={tickStyles.statusPill}>
          <span style={tickStyles.dot} />
          Pending confirmation from cashier
        </div>

        <p style={tickStyles.subtext}>
          Your receipt will appear here as soon as the cashier confirms your
          payment. No need to refresh.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // TRACKING — kitchen status. Prep time only shows while PREPARING.
  // ---------------------------------------------------------------------
  if (screen === "TRACKING" && currentOrder) {
    const stageMap = {
      PENDING: {
        icon: "📝",
        title: "Order received",
        body: "We've got your order — the kitchen will start on it shortly.",
      },
      PREPARING: {
        icon: "👨‍🍳",
        title: "Being prepared",
        body: `Our chefs are cooking your meal fresh. About ${currentOrder.estimatedPreparationTime} minutes to go.`,
      },
      READY: {
        icon: "🍽️",
        title: "Ready to serve",
        body: "Your meal is plated and a waiter is bringing it to your table.",
      },
      SERVED: {
        icon: "✅",
        title: "Enjoy your meal!",
        body: "Everything's on the table. Whenever you're ready, tap below to pay.",
      },
    };

    const stage = stageMap[currentOrder.status] || stageMap.PENDING;

    return (
      <div style={trackStyles.page}>
        <style>{tickKeyframes}</style>

        <p style={trackStyles.tableLabel}>Table {table.tableNumber}</p>

        <div style={trackStyles.iconWrap}>
          <span style={trackStyles.icon}>{stage.icon}</span>
        </div>

        <h1 style={trackStyles.title}>{stage.title}</h1>
        <p style={trackStyles.body}>{stage.body}</p>

        <div style={trackStyles.progressRow}>
          {["PENDING", "PREPARING", "READY", "SERVED"].map((step, i) => {
            const order = ["PENDING", "PREPARING", "READY", "SERVED"];
            const currentIndex = order.indexOf(currentOrder.status);
            const done = i <= currentIndex;

            return (
              <div key={step} style={trackStyles.stepWrap}>
                <div
                  style={{
                    ...trackStyles.stepDot,
                    background: done ? "#ff6b00" : "#e5e5e5",
                  }}
                />
                {i < 3 && (
                  <div
                    style={{
                      ...trackStyles.stepLine,
                      background: i < currentIndex ? "#ff6b00" : "#e5e5e5",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {currentOrder.status === "SERVED" && (
          <button
            style={trackStyles.payButton}
            onClick={() => {
              // Previously this PATCHed status to PAYMENT_REQUESTED here,
              // before the customer had chosen a payment method at all —
              // that immediately surfaced the order in the Cashier's
              // queue labeled with whatever placeholder paymentMethod
              // the order was created with ("CASH" from checkout), even
              // if the customer went on to pick UPI or Card. Worse, if
              // the cashier confirmed payment in the gap before the real
              // choice was PATCHed in from the Pay Now button below, the
              // order would get stuck PAID with the wrong method forever.
              //
              // Fix: this button now only moves the customer to the
              // payment-method screen locally. The backend PATCH (status
              // + the real paymentMethod, together, atomically) happens
              // once, from "Pay Now" below — so there's exactly one
              // moment this order can appear in the cashier's queue, and
              // it's always with the method the customer actually chose.
              setScreen("PAYMENT");
            }}
          >
            I'm Ready To Pay
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // REVIEW — redesigned receipt
  // ---------------------------------------------------------------------
  if (screen === "REVIEW" && currentOrder) {
    const receiptUrl = `${window.location.origin}/receipt/${currentOrder.id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(receiptUrl)}`;

    const paidDate = new Date(currentOrder.paidAt || Date.now());
    const dateLabel = paidDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeLabel = paidDate.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div style={receiptStyles.backdrop}>
        {!showReceipt ? (
          <div style={styles.successPage}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h1 style={{ color: "#fff" }}>Payment Confirmed</h1>
            <p style={{ color: "rgba(255,255,255,.6)", marginBottom: 30 }}>
              Thank you for dining with us.
            </p>

            <button
              style={{ ...styles.primaryButton, margin: 0, width: "auto", padding: "14px 34px" }}
              onClick={() => setShowReceipt(true)}
            >
              View Receipt
            </button>
          </div>
        ) : (
          <div style={receiptStyles.wrapper}>
            <div style={receiptStyles.card}>
              <div style={receiptStyles.brandRow}>
                <span style={receiptStyles.brandName}>Baraka Restaurant</span>
                <span style={receiptStyles.paidTag}>PAID</span>
              </div>

              <div style={receiptStyles.dateTimeRow}>
                <span>{dateLabel}</span>
                <span>{timeLabel}</span>
              </div>

              <div style={receiptStyles.divider} />

              <div style={receiptStyles.metaGrid}>
                <Meta label="Receipt No." value={`#${currentOrder.id}`} />
                <Meta label="Table" value={currentOrder.tableNumber} />
                <Meta label="Customer" value={currentOrder.customerName} />
                <Meta label="Payment" value={currentOrder.paymentMethod} />
              </div>

              <div style={receiptStyles.divider} />

              <p style={receiptStyles.itemsHeading}>Items</p>

              {currentOrder.items.map((item) => (
                <div key={item.id} style={receiptStyles.itemRow}>
                  <div>
                    <div style={receiptStyles.itemName}>{item.menuItem.name}</div>
                    <div style={receiptStyles.itemQty}>
                      {item.quantity} × ₹{item.price}
                    </div>
                  </div>
                  <span style={receiptStyles.itemAmount}>
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              ))}

              <div style={receiptStyles.divider} />

              <div style={receiptStyles.totalRow}>
                <span>Total Paid</span>
                <span>₹{currentOrder.totalAmount}</span>
              </div>

              <div style={receiptStyles.qrWrap}>
                <img src={qrImageUrl} alt="Receipt verification QR code" style={receiptStyles.qrImage} />
                <p style={receiptStyles.qrCaption}>Scan to verify this receipt</p>
              </div>

              <p style={receiptStyles.footerNote}>Thank you for visiting us!</p>
            </div>

            <div style={receiptStyles.actionRow}>
              <button style={{ ...styles.primaryButton, margin: 0, flex: 1 }} onClick={() => window.print()}>
                Print Receipt
              </button>

              <button
                style={{ ...styles.primaryButton, margin: 0, flex: 1, background: "#333" }}
                onClick={() => setScreen("RATING")}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "RATING") {
    return (
      <div style={ratingStyles.page}>
        <div style={ratingStyles.card}>
          <h2 style={ratingStyles.title}>How was your experience?</h2>

          <div style={ratingStyles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                style={ratingStyles.starButton}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <span
                  style={{
                    color: n <= (hoverRating || rating) ? "#f5a623" : "#e0e0e0",
                    fontSize: 40,
                  }}
                >
                  ★
                </span>
              </button>
            ))}
          </div>

          <textarea
            placeholder="Tell us more (optional)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            style={ratingStyles.textarea}
            rows={4}
          />

          <button
            style={styles.primaryButton}
            disabled={rating === 0 || submittingReview}
            onClick={submitReview}
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>

          <button style={ratingStyles.skipButton} onClick={finishSession}>
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (screen === "THANK_YOU") {
    return (
      <div style={styles.successPage}>
        <h1 style={{ fontSize: 56 }}>🎉</h1>
        <h2>Thank You!</h2>
        <p>We hope to serve you again.</p>
        <p style={{ color: "#e91e63", fontWeight: 700, marginTop: 8 }}>
          Visit Again ❤️
        </p>

        <button
          style={{ ...styles.primaryButton, margin: "24px auto 0", width: "auto", padding: "12px 28px" }}
          onClick={() => setScreen("MENU")}
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.restaurant}>Restaurant Menu</h1>
          <p style={styles.table}>Table {table.tableNumber}</p>
        </div>
      </header>

      <section style={styles.customerCard}>
        <input
          placeholder="Your Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Phone Number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={styles.input}
        />
      </section>

      <div style={styles.dietToggleWrap}>
        <span
          style={{
            ...styles.dietLabel,
            color: "#0a8a0a",
            opacity: dietMode === "VEG" ? 1 : 0.4,
          }}
        >
          🟢 Veg
        </span>

        <button
          style={{
            ...styles.toggleTrack,
            background: dietMode === "VEG" ? "#0a8a0a" : "#a5291d",
          }}
          onClick={() => setPendingDietMode(dietMode === "VEG" ? "NONVEG" : "VEG")}
        >
          <span
            style={{
              ...styles.toggleKnob,
              transform: dietMode === "VEG" ? "translateX(0px)" : "translateX(26px)",
            }}
          />
        </button>

        <span
          style={{
            ...styles.dietLabel,
            color: "#a5291d",
            opacity: dietMode === "NONVEG" ? 1 : 0.4,
          }}
        >
          🔴 Non-Veg
        </span>
      </div>

      {pendingDietMode && (
        <div style={styles.confirmBackdrop}>
          <div style={styles.confirmCard}>
            <p style={styles.confirmText}>
              You're about to switch to{" "}
              <strong style={{ color: pendingDietMode === "VEG" ? "#0a8a0a" : "#a5291d" }}>
                {pendingDietMode === "VEG" ? "Veg" : "Non-Veg"} dishes
              </strong>
              . Continue?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  ...styles.primaryButton,
                  margin: 0,
                  background: pendingDietMode === "VEG" ? "#0a8a0a" : "#a5291d",
                }}
                onClick={() => {
                  setDietMode(pendingDietMode);
                  setPendingDietMode(null);
                }}
              >
                OK
              </button>
              <button
                style={{ ...styles.primaryButton, margin: 0, background: "#999" }}
                onClick={() => setPendingDietMode(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.categoryRow}>
        {categories.map((category) => (
          <button
            key={category}
            style={{
              ...styles.categoryButton,
              background: selectedCategory === category ? "#ff6b00" : "#ffffff",
              color: selectedCategory === category ? "#ffffff" : "#333333",
            }}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {visibleItems.map((item) => {
          const quantity = cart[item.id] || 0;

          return (
            <div key={item.id} style={styles.card}>
              <img src={getFoodImage(item.name)} alt={item.name} style={styles.image} />
              <h3 style={{ color: "#1a1a1a", margin: "12px 15px 6px" }}>
                <VegDot isVeg={item.veg} />
                {item.name}
              </h3>
              <p style={styles.price}>₹{item.price}</p>
              <p style={styles.description}>
                {item.description || "Freshly prepared by our chefs."}
              </p>

              {quantity === 0 ? (
                <button style={styles.primaryButton} onClick={() => increase(item.id)}>
                  Add To Cart
                </button>
              ) : (
                <div style={styles.quantityBox}>
                  <button style={styles.qtyButton} onClick={() => decrease(item.id)}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button style={styles.qtyButton} onClick={() => increase(item.id)}>
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
            <div>₹{totalPrice.toFixed(2)}</div>
          </div>

         <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <input
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "none" }}
            />

            <input
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "none" }}
            />

            <button style={styles.checkoutButton} disabled={placingOrder} onClick={placeOrder}>
              {placingOrder ? "Placing..." : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div style={receiptStyles.metaLabel}>{label}</div>
      <div style={receiptStyles.metaValue}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CSS keyframes shared by the payment animation and the tracking icon
// ---------------------------------------------------------------------
const tickKeyframes = `
@keyframes tickCircle {
  from { stroke-dashoffset: 365; }
  to { stroke-dashoffset: 0; }
}
@keyframes tickMark {
  from { stroke-dashoffset: 80; }
  to { stroke-dashoffset: 0; }
}
@keyframes pulseSoft {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
@keyframes dotBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// New: the "finding you a table" / "sorry, full" landing states.
const assignStyles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    background: "#fff7f0",
  },
  pulse: {
    fontSize: 64,
    marginBottom: 20,
    animation: "pulseSoft 2s ease-in-out infinite",
  },
  title: { fontSize: 26, margin: "0 0 10px", color: "#1a1a1a" },
  sub: { fontSize: 16, color: "#666", maxWidth: 380, lineHeight: 1.6 },
};

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 14px",
    paddingBottom: 120,
    fontFamily: "Arial, sans-serif",
    background: "#fafafa",
    minHeight: "100vh",
  },
  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    fontWeight: 600,
  },
  successPage: {
    maxWidth: 500,
    margin: "100px auto",
    textAlign: "center",
    padding: 30,
  },
  header: {
    background: "#ff6b00",
    color: "#fff",
    padding: 30,
    borderRadius: 15,
    marginBottom: 25,
  },
  restaurant: { margin: 0, fontSize: 34 },
  table: { marginTop: 10, opacity: 0.9, fontSize: 18 },
  customerCard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 15,
    marginBottom: 25,
  },
  input: { padding: 14, borderRadius: 10, border: "1px solid #ddd", fontSize: 16 },
  categoryRow: { display: "flex", gap: 10, overflowX: "auto", marginBottom: 25 },
  categoryButton: {
    border: "1px solid #ff6b00",
    borderRadius: 30,
    padding: "10px 18px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 600,
  },
  dietToggleWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    margin: "20px 0",
  },
  dietLabel: { fontWeight: 700, fontSize: 15, transition: "opacity .2s" },
  toggleTrack: {
    width: 56,
    height: 30,
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    position: "relative",
    padding: 2,
  },
  toggleKnob: {
    display: "block",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform .2s",
  },
  confirmBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  confirmCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    maxWidth: 320,
    textAlign: "center",
  },
  confirmText: { marginBottom: 20, fontSize: 15, lineHeight: 1.5, color: "#1a1a1a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))", gap: 16 },
  card: { background: "#fff", borderRadius: 15, overflow: "hidden", boxShadow: "0 3px 12px rgba(0,0,0,.08)" },
  image: { width: "100%", height: 190, objectFit: "cover" },
  price: { color: "#ff6b00", fontWeight: 700, fontSize: 22, marginLeft: 15 },
  description: { padding: "0 15px", color: "#666", minHeight: 45 },
  primaryButton: {
    margin: 15,
    width: "calc(100% - 30px)",
    padding: 12,
    border: "none",
    borderRadius: 10,
    background: "#ff6b00",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  quantityBox: { display: "flex", justifyContent: "center", alignItems: "center", gap: 20, padding: 15 },
  qtyButton: {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 8,
    background: "#ff6b00",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
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
  padding: 16,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
},
  checkoutButton: {
    background: "#ff6b00",
    color: "#fff",
    border: "none",
    padding: "14px 30px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
  },
};

// Full-screen Paytm/UPI-style payment animation
const tickStyles = {
  page: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(180deg,#0f172a 0%,#020617 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    zIndex: 50,
  },
  svg: { width: 150, height: 150, marginBottom: 22 },
  circleAnim: {
    strokeDasharray: 365,
    strokeDashoffset: 365,
    transform: "rotate(-90deg)",
    transformOrigin: "65px 65px",
    animation: "tickCircle 1.1s ease-out forwards",
  },
  tickAnim: {
    strokeDasharray: 80,
    strokeDashoffset: 80,
    animation: "tickMark 0.6s ease-out 0.9s forwards",
  },
  amount: { color: "#fff", fontSize: 40, margin: "0 0 4px", fontWeight: 800 },
  method: { color: "rgba(255,255,255,0.55)", fontSize: 15, marginBottom: 28 },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 40,
    fontSize: 15,
    fontWeight: 600,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#facc15",
    animation: "dotBlink 1.2s ease-in-out infinite",
  },
  subtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    maxWidth: 300,
    marginTop: 22,
    lineHeight: 1.6,
  },
};

// Clear, bigger tracking screen
const trackStyles = {
  page: {
    minHeight: "100vh",
    background: "#fff7f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  tableLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ff6b00",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  iconWrap: {
    width: 130,
    height: 130,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(255,107,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    animation: "pulseSoft 2.2s ease-in-out infinite",
  },
  icon: { fontSize: 62 },
  title: { fontSize: 30, margin: "0 0 12px", color: "#1a1a1a" },
  body: { fontSize: 17, color: "#555", maxWidth: 380, lineHeight: 1.6, marginBottom: 34 },
  progressRow: { display: "flex", alignItems: "center", marginBottom: 34 },
  stepWrap: { display: "flex", alignItems: "center" },
  stepDot: { width: 14, height: 14, borderRadius: "50%" },
  stepLine: { width: 44, height: 4, borderRadius: 2 },
  payButton: {
    padding: "16px 40px",
    border: "none",
    borderRadius: 12,
    background: "#ff6b00",
    color: "#fff",
    fontWeight: 700,
    fontSize: 17,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(255,107,0,0.3)",
  },
};

// Redesigned receipt — one total, date/time, clean grid layout
const receiptStyles = {
  backdrop: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, #2f2b26 0%, #17140f 70%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 20px",
    fontFamily: "Arial, sans-serif",
  },
  wrapper: { width: "min(400px, 92vw)" },
  card: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "30px 26px",
    color: "#1a1a1a",
    boxShadow: "0 18px 45px rgba(0,0,0,.5)",
  },
  brandRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  brandName: { fontSize: 17, fontWeight: 800 },
  paidTag: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#2e7d32",
    background: "#e8f5e9",
    padding: "4px 10px",
    borderRadius: 20,
  },
  dateTimeRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },
  divider: { borderTop: "1px dashed #ddd", margin: "16px 0" },
  metaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 14, columnGap: 10 },
  metaLabel: { fontSize: 11, color: "#999", marginBottom: 3 },
  metaValue: { fontSize: 14, fontWeight: 700 },
  itemsHeading: { fontSize: 11, color: "#999", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: 600 },
  itemQty: { fontSize: 12, color: "#999", marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: 700 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 800 },
  qrWrap: { textAlign: "center", marginTop: 22 },
  qrImage: { width: 110, height: 110 },
  qrCaption: { fontSize: 11, color: "#999", marginTop: 8 },
  footerNote: { textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 14 },
  actionRow: { display: "flex", gap: 10, marginTop: 26 },
};

const ratingStyles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 32px",
    width: "min(420px, 92vw)",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,.1)",
  },
  title: { margin: "0 0 20px", fontSize: 22, color: "#222" },
  stars: { display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 },
  starButton: { background: "none", border: "none", cursor: "pointer", padding: 0 },
  textarea: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 15,
    fontFamily: "inherit",
    marginBottom: 18,
    resize: "vertical",
    boxSizing: "border-box",
  },
  skipButton: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: 14,
    cursor: "pointer",
    marginTop: 8,
    textDecoration: "underline",
  },
};
