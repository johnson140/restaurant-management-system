import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Wrap a route element with allowed roles, e.g.:
// <ProtectedRoute allowedRoles={["ADMIN"]}><Staff /></ProtectedRoute>
// Omit allowedRoles to just require any logged-in user.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
