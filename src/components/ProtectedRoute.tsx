import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/jwtHelper";

interface Props {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;

  if (!user) return <Navigate to="/login" />;
  
  if (requiredRole) {
    const userRoleName = getRoleName(user.roleId);
    
    const normalizedUserRole = userRoleName.toLowerCase();
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const normalizedRequiredRoles = roles.map(role => role.toLowerCase());
    
    if (!normalizedRequiredRoles.includes(normalizedUserRole)) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;