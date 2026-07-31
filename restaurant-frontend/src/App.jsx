import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Menu from "@/pages/admin/Menu";
import Tables from "@/pages/admin/Tables";
import Inventory from "@/pages/admin/Inventory";
import Staff from "@/pages/admin/Staff";
import Analytics from "@/pages/admin/Analytics";
import Settings from "@/pages/admin/Settings";



// Public pages
import Login from "@/pages/Login";

// Staff pages
import KitchenQueue from "@/pages/chef/KitchenQueue";
import ServiceBoard from "@/pages/waiter/ServiceBoard";
import CashierPage from "@/pages/cashier/CashierPage";

// Customer pages
import CustomerOrderPage from "@/pages/customer/CustomerOrderPage";
import ReceiptPage from "@/pages/customer/ReceiptPage";
import Kiosk from "@/pages/customer/Kiosk";


function RoleHome() {
  const { user } = useAuth();

  if (user?.role === "CHEF") return <KitchenQueue />;
  if (user?.role === "WAITER") return <ServiceBoard />;
  if (user?.role === "CASHIER") return <CashierPage />;

  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* ===========================
          PUBLIC ROUTES
      ============================ */}

      <Route path="/login" element={<Login />} />

      {/* Customer QR Ordering — always arrived at with a real ?token=,
          which comes from scanning the QR shown on /kiosk. */}
      <Route path="/customer" element={<CustomerOrderPage />} />

      {/* Entrance/front-of-house display. Left open on a laptop or
          tablet; shows a live QR for one available table and swaps to
          the next one automatically once that table is booked. No login
          required — it's meant to run unattended, same as /customer. */}
      <Route path="/kiosk" element={<Kiosk />} />

      {/* Digital receipt — opened by scanning the QR code on a paid order.
          NOTE: DigitalReceipt.jsx used to also claim this path — that
          duplicate route registration meant it silently never rendered
          (React Router uses the first match). ReceiptPage is now the
          single source of truth for this URL; DigitalReceipt.jsx can be
          deleted once its contents are confirmed fully superseded. */}
      <Route path="/receipt/:orderId" element={<ReceiptPage />} />

      {/* ===========================
          PROTECTED ROUTES
      ============================ */}

      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "CHEF", "WAITER", "CASHIER"]}>
            <Layout>
              <RoleHome />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Menu />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tables"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Tables />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "CASHIER"]}>
            <Layout>
              <CashierPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Staff />
            </Layout>
          </ProtectedRoute>
        }
      />
         <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
        );
      }
