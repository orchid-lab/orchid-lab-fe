import type { User } from "../types/Auth";

export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

function getRoleID(roleName: string | undefined): number {
  if (!roleName) return 0;
  
  const roleMap: Record<string, number> = {
    'Admin': 1,
    'Method': 2,
    'Technician': 3,
  };
  
  return roleMap[roleName] || 0;
}

export function extractUserFromJWT(token: string, email: string): User | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  let roleID = 0;
  
  if (decoded.RoleID && typeof decoded.RoleID === 'number') {
    roleID = decoded.RoleID;
  } else if (decoded.roleID && typeof decoded.roleID === 'number') {
    roleID = decoded.roleID;
  } else if (decoded.RoleName) {
    roleID = getRoleID(decoded.RoleName);
  } else if (decoded.role) {
    roleID = getRoleID(decoded.role);
  }
  
  if (!roleID) {
    console.error("Could not determine roleID from JWT");
    return null;
  }
  
  return {
    id: decoded.sub || decoded.userID || decoded.UserID || email,
    email: email,
    name: decoded.name || decoded.Name || decoded.fullName || decoded.FullName || "User",
    userName: decoded.userName || null,
    password: "", // Not stored in JWT
    phoneNumber: decoded.phoneNumber || "",
    roleID: roleID,
    create_at: new Date().toISOString(),
    create_by: null,
    avatarUrl: decoded.avatarUrl || null,
  };
}

export function getRedirectPath(roleID: number): string {
  const paths: Record<number, string> = {
    1: "/admin/user",
    2: "/method",
    3: "/technician/tasks",
  };
  return paths[roleID] || "/";
}