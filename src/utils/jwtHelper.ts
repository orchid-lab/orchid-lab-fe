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

export function extractUserFromJWT(token: string, email: string): User | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  let role = "Researcher"; // default role
  
  // Try to extract role from various possible fields
  if (decoded.role && typeof decoded.role === 'string') {
    role = decoded.role;
  } else if (decoded.Role && typeof decoded.Role === 'string') {
    role = decoded.Role;
  } else if (decoded.RoleName && typeof decoded.RoleName === 'string') {
    role = decoded.RoleName;
  }
  
  return {
    id: decoded.sub || decoded.userID || decoded.UserID || email,
    email: email,
    name: decoded.name || decoded.Name || decoded.fullName || decoded.FullName || "User",
    password: "", // Not stored in JWT
    phoneNumber: decoded.phoneNumber || decoded.PhoneNumber || "",
    role: role, // Changed from roleID to role
    createdDate: decoded.createdDate || new Date().toISOString(), // Changed from create_at
    createdBy: decoded.createdBy || null,
    avatarUrl: decoded.avatarUrl || decoded.AvatarUrl || null,
  };
}

export function getRedirectPath(role: string): string {
  const paths: Record<string, string> = {
    'Admin': "/dashboard",
    'Researcher': "/tasks",
    'Technician': "/tasks",
  };
  return paths[role] || "/tasks";
}