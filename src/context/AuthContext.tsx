import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types/Auth";
import axiosInstance from "../api/axiosInstance";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthReady: boolean;
  login: (data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedUser && storedAccessToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser) as User);
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    }
    setIsAuthReady(true);
  }, []);

  const handleLogoutApi = async () => {
      const res = await axiosInstance.post("/api/authentication/logout", {
        refreshToken: refreshToken,
      });
      if (res.status !== 200) {
        throw new Error("Đăng xuất không thành công");
      }
  };

  const login = ({
    accessToken,
    refreshToken,
    user,
  }: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => {
    // Clear old data first to avoid stale cache
    localStorage.clear();
    
    // Normalize role to lowercase for consistent checking
    // Check 'Role' (capital R from API) first, then 'role' (lowercase r)
    const roleFromApi = (user as any).Role || (user as any).role;
    
    if (roleFromApi && typeof roleFromApi === 'string') {
      // Store normalized lowercase role
      user.role = roleFromApi.toLowerCase().trim();
    } else if (user.roleId) {
      // Fallback to roleId mapping
      // IMPORTANT: Verify these roleId mappings match your database
      switch (user.roleId) {
        case 1:
          user.role = "researcher";
          break;
        case 2:
          user.role = "admin";
          break;
        case 3:
          user.role = "lab technician";
          break;
        default:
          user.role = "researcher";
      }
    }
    
    setUser(user);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };

  const logout = () => {
    handleLogoutApi();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  };
  
  const updateUser = (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthReady,
        login,
        logout,
        setTokens,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}