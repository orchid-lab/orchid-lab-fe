import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  requiredRole?: number | number[];
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;

  if (!user) return <Navigate to="/login" />;
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.roleID)) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
