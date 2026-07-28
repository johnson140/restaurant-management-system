import { Routes, Route } from "react-router-dom";


import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import Login from "./pages/Login";

import KitchenQueue from "./pages/chef/KitchenQueue";
import ServiceBoard from "./pages/waiter/ServiceBoard";

import CashierPage from "./pages/CashierPage";
// NEW
import CustomerOrderPage from "./pages/CustomerOrderPage";

function RoleHome() {
  const { user } = useAuth();

  if (user?.role === "CHEF") {
    return <KitchenQueue />;
  }

  if (user?.role === "WAITER") {
    return <ServiceBoard />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>

      {/* ===========================
          PUBLIC ROUTES
      ============================ */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* Customer QR Ordering */}
      <Route
        path="/customer"
        element={<CustomerOrderPage />}
      />

      {/* ===========================
          PROTECTED ROUTES
      ============================ */}

      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN", "CHEF", "WAITER"]}
          >
            <Layout>
              <RoleHome />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          >
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu"
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          >
            <Layout>
              <Menu />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          >
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
    <Route
        path="/cashier"
        element={<CashierPage />}
    />

      <Route
        path="/staff"
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          >
            <Layout>
              <Staff />
            </Layout>
          </ProtectedRoute>
        }
      />

    </Routes>


  );
}