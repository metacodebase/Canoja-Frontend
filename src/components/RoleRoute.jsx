import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  admin: "/admin/retailers",
  operator: "/operator/dashboard",
  consumer: "/explore",
};

const getRoleHome = (role) => ROLE_HOME[role] || "/explore";

const RoleRoute = ({ allowedRoles, children }) => {
  const { activeBusinessId, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />;
  }

  if (
    user?.role === "operator" &&
    user.businesses?.length > 1 &&
    !activeBusinessId &&
    location.pathname !== "/operator/switch-business"
  ) {
    return <Navigate to="/operator/switch-business" replace />;
  }

  return children;
};

export default RoleRoute;
