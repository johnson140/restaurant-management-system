import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { decodeToken } from "@/utils/decodeToken";
import { FaShieldAlt, FaUserTie, FaEye, FaEyeSlash } from "react-icons/fa";

// Self-contained: markup + styles in one file, same principle as before.
// Class names prefixed "rms-" and unique to this page.

const PARTICLES = [
  { left: "8%", size: 3, dur: 22, delay: -2, op: 0.5 },
  { left: "18%", size: 2, dur: 28, delay: -14, op: 0.35 },
  { left: "27%", size: 4, dur: 18, delay: -6, op: 0.4 },
  { left: "38%", size: 2, dur: 26, delay: -20, op: 0.3 },
  { left: "49%", size: 3, dur: 24, delay: -9, op: 0.45 },
  { left: "59%", size: 2, dur: 30, delay: -3, op: 0.3 },
  { left: "68%", size: 4, dur: 20, delay: -16, op: 0.4 },
  { left: "77%", size: 2, dur: 27, delay: -11, op: 0.35 },
  { left: "85%", size: 3, dur: 23, delay: -5, op: 0.5 },
  { left: "92%", size: 2, dur: 29, delay: -19, op: 0.3 },
  { left: "14%", size: 2, dur: 25, delay: -8, op: 0.3 },
  { left: "63%", size: 3, dur: 21, delay: -13, op: 0.4 },
];

// Which side of the toggle a given backend role belongs on. Admin owns
// the "admin" card; everyone else (chef/waiter/cashier, and anything
// added later) belongs on "staff". Centralized so adding a new staff
// role later doesn't require touching the mismatch logic below.
const ADMIN_ROLES = ["ADMIN"];

function correctSideFor(role) {
  return ADMIN_ROLES.includes(role) ? "admin" : "staff";
}

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const token = response.data.token;
      const decoded = decodeToken(token);
      const actualSide = correctSideFor(decoded?.role);

      // Credentials were valid, but this account doesn't belong on the
      // card the person submitted from (e.g. a cashier's password typed
      // into the Admin face). Don't log them in — the whole point of
      // the toggle is that it's supposed to mean something. Clear the
      // password (don't carry it across the flip), explain what
      // happened, and flip the card to where this account actually
      // belongs so they can just retype and go.
      if (actualSide !== role) {
        setPassword("");
        setError(
          actualSide === "admin"
            ? "That's an admin account. Switching you to the Admin tab — go ahead and sign in there."
            : "That's a staff account. Switching you to the Staff tab — go ahead and sign in there."
        );

        window.setTimeout(() => setRole(actualSide), 700);
        return;
      }

      authLogin(token);
      navigate("/");
    } catch (err) {
      console.log(err.response);
      console.log(err);

      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  function switchRole(next) {
    if (next === role) return;
    setError(null);
    setRole(next);
  }

  return (
    <div className="rms-login-page" data-role={role}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .rms-login-page {
          --accent: #5E8BFF;
          --accent-soft: rgba(94, 139, 255, 0.16);
          height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0A0D14;
          font-family: 'Inter', system-ui, sans-serif;
          transition: --accent 0.5s ease;
        }

        .rms-login-page[data-role="staff"] {
          --accent: #F2A65A;
          --accent-soft: rgba(242, 166, 90, 0.16);
        }

        /* ---------- background ---------- */
        .rms-bg { position: absolute; inset: 0; z-index: 0; }

        .rms-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(ellipse at 50% 40%, black 10%, transparent 72%);
        }

        .rms-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          transition: background 0.6s ease;
          animation: rms-drift 34s ease-in-out infinite alternate;
        }
        .rms-blob-a {
          width: 520px; height: 520px;
          background: var(--accent-soft);
          top: -160px; left: -120px;
        }
        .rms-blob-b {
          width: 460px; height: 460px;
          background: rgba(94, 139, 255, 0.08);
          bottom: -160px; right: -100px;
          animation-duration: 40s;
          animation-delay: -10s;
        }
        .rms-blob-c {
          width: 380px; height: 380px;
          background: rgba(255,255,255,0.03);
          top: 45%; left: 55%;
          animation-duration: 46s;
          animation-delay: -20s;
        }
        @keyframes rms-drift {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(50px, 35px) scale(1.12); }
        }

        .rms-particle {
          position: absolute;
          bottom: -10px;
          border-radius: 50%;
          background: var(--accent);
          animation-name: rms-float;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes rms-float {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: var(--op, 0.4); }
          90%  { opacity: var(--op, 0.4); }
          100% { transform: translateY(-100vh); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rms-blob, .rms-particle { animation: none; }
        }

        /* ---------- role toggle ---------- */
        .rms-toggle-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .rms-toggle {
          position: relative;
          display: flex;
          width: 240px;
          padding: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          backdrop-filter: blur(20px);
        }

        .rms-toggle-pill {
          position: absolute;
          top: 4px;
          left: 4px;
          width: calc(50% - 4px);
          height: calc(100% - 8px);
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 20px var(--accent-soft);
          transition: transform 0.45s cubic-bezier(.65,0,.35,1), background 0.5s ease;
        }
        .rms-login-page[data-role="staff"] .rms-toggle-pill {
          transform: translateX(100%);
        }

        .rms-toggle button {
          position: relative;
          z-index: 1;
          flex: 1;
          border: none;
          background: none;
          padding: 9px 0;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #8890A3;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: color 0.3s ease;
        }
        .rms-toggle button.active { color: #0A0D14; }

        /* ---------- flip card ---------- */
        .rms-scene { perspective: 1600px; z-index: 2; position: relative; }

        .rms-card-flip {
          width: 380px;
          min-height: 460px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(.65,0,.35,1);
        }
        .rms-login-page[data-role="staff"] .rms-card-flip {
          transform: rotateY(180deg);
        }

        .rms-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 22px;
          padding: 40px 36px;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(24px);
          box-shadow: 0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
        }
        .rms-face-back { transform: rotateY(180deg); }

        .rms-icon-badge {
          width: 46px; height: 46px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 19px;
          margin-bottom: 22px;
        }

        .rms-face h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #EDEFF4;
          margin: 0 0 6px 0;
          letter-spacing: -0.01em;
        }
        .rms-face p.rms-sub {
          color: #8890A3;
          font-size: 13.5px;
          margin: 0 0 26px 0;
          line-height: 1.5;
        }

        .rms-field-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #B4BACC;
          margin-bottom: 7px;
          font-family: 'Inter', sans-serif;
        }

        .rms-face input {
          width: 100%;
          padding: 12px 14px;
          margin-bottom: 18px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 14.5px;
          background: rgba(255,255,255,0.03);
          color: #EDEFF4;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .rms-face input::placeholder { color: #565D70; }
        .rms-face input:focus {
          border-color: var(--accent);
          background: rgba(255,255,255,0.05);
          outline: none;
        }

        .rms-password-box { position: relative; display: flex; align-items: center; margin-bottom: 18px; }
        .rms-password-box input { margin-bottom: 0; padding-right: 42px; }

        .rms-eye-btn {
          position: absolute;
          right: 13px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 15px;
          color: #8890A3;
          padding: 0;
          display: flex;
        }

        .rms-login-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          background: var(--accent);
          color: #0A0D14;
          cursor: pointer;
          margin-top: 6px;
          transition: filter 0.2s ease, transform 0.15s ease;
        }
        .rms-login-btn:hover { filter: brightness(1.08); }
        .rms-login-btn:active { transform: scale(0.99); }
        .rms-login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rms-login-error {
          background: rgba(255,90,90,0.1);
          border: 1px solid rgba(255,90,90,0.25);
          color: #FF9C9C;
          padding: 10px 13px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .rms-login-notice {
          background: rgba(94,139,255,0.1);
          border: 1px solid rgba(94,139,255,0.3);
          color: #AFC4FF;
          padding: 10px 13px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
        }
        .rms-login-page[data-role="staff"] .rms-login-notice {
          background: rgba(242,166,90,0.1);
          border-color: rgba(242,166,90,0.3);
          color: #FFD3A6;
        }

        .rms-face-footer {
          margin-top: auto;
          padding-top: 18px;
          font-size: 12px;
          color: #565D70;
          text-align: center;
        }

        @media (max-width: 440px) {
          .rms-card-flip, .rms-face { width: 90vw; max-width: 380px; }
        }
      `}</style>

      <div className="rms-bg" aria-hidden="true">
        <div className="rms-grid" />
        <div className="rms-blob rms-blob-a" />
        <div className="rms-blob rms-blob-b" />
        <div className="rms-blob rms-blob-c" />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="rms-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              "--op": p.op,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="rms-toggle-wrap">
        <div className="rms-toggle">
          <div className="rms-toggle-pill" />
          <button
            type="button"
            className={role === "admin" ? "active" : ""}
            onClick={() => switchRole("admin")}
          >
            <FaShieldAlt /> Admin
          </button>
          <button
            type="button"
            className={role === "staff" ? "active" : ""}
            onClick={() => switchRole("staff")}
          >
            <FaUserTie /> Staff
          </button>
        </div>

        <div className="rms-scene">
          <div className="rms-card-flip">
            {/* ADMIN FACE */}
            <div className="rms-face">
              <div className="rms-icon-badge"><FaShieldAlt /></div>
              <h1>Admin sign in</h1>
              <p className="rms-sub">Full access to menu, orders, staff and inventory.</p>

              {error && role === "admin" && (
                <p
                  className={
                    error.startsWith("That's")
                      ? "rms-login-notice"
                      : "rms-login-error"
                  }
                >
                  {error}
                </p>
              )}

              <form onSubmit={login}>
                <label className="rms-field-label" htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  placeholder="e.g. jdoe"
                  value={role === "admin" ? username : ""}
                  onChange={(e) => setUsername(e.target.value)}
                  required={role === "admin"}
                  tabIndex={role === "admin" ? 0 : -1}
                />

                <label className="rms-field-label" htmlFor="admin-password">Password</label>
                <div className="rms-password-box">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={role === "admin" ? password : ""}
                    onChange={(e) => setPassword(e.target.value)}
                    required={role === "admin"}
                    tabIndex={role === "admin" ? 0 : -1}
                  />
                  <button
                    type="button"
                    className="rms-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button className="rms-login-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in as Admin"}
                </button>
              </form>

              <div className="rms-face-footer">Restaurant Management System</div>
            </div>

            {/* STAFF FACE */}
            <div className="rms-face rms-face-back">
              <div className="rms-icon-badge"><FaUserTie /></div>
              <h1>Staff sign in</h1>
              <p className="rms-sub">For chefs, cashiers and floor staff.</p>

              {error && role === "staff" && (
                <p
                  className={
                    error.startsWith("That's")
                      ? "rms-login-notice"
                      : "rms-login-error"
                  }
                >
                  {error}
                </p>
              )}

              <form onSubmit={login}>
                <label className="rms-field-label" htmlFor="staff-username">Username</label>
                <input
                  id="staff-username"
                  placeholder="e.g. alex"
                  value={role === "staff" ? username : ""}
                  onChange={(e) => setUsername(e.target.value)}
                  required={role === "staff"}
                  tabIndex={role === "staff" ? 0 : -1}
                />

                <label className="rms-field-label" htmlFor="staff-password">Password</label>
                <div className="rms-password-box">
                  <input
                    id="staff-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={role === "staff" ? password : ""}
                    onChange={(e) => setPassword(e.target.value)}
                    required={role === "staff"}
                    tabIndex={role === "staff" ? 0 : -1}
                  />
                  <button
                    type="button"
                    className="rms-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button className="rms-login-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in as Staff"}
                </button>
              </form>

              <div className="rms-face-footer">Restaurant Management System</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
