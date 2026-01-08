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

export function getRoleName(roleId: number): string {
  const roleNames: Record<number, string> = {
    1: "Admin",
    2: "Researcher",
    3: "Lab Technician",
  };
  return roleNames[roleId] || "Researcher";
}

export function extractUserFromJWT(token: string, email: string): User | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  let roleId = 2; // default to Researcher
  let roleString = "";
  
  // PRIORITY 1: Try to extract RoleName (the definitive role name from backend)
  if (decoded.RoleName && typeof decoded.RoleName === 'string') {
    roleString = decoded.RoleName;
    
    // Convert RoleName to roleId for consistency
    switch (roleString.toLowerCase().trim()) {
      case 'admin':
        roleId = 1;
        break;
      case 'researcher':
        roleId = 2;
        break;
      case 'lab technician':
      case 'technician':
        roleId = 3;
        break;
      default:
        roleId = 2;
    }
  }
  // PRIORITY 2: Try Role or role string
  else if (decoded.Role && typeof decoded.Role === 'string') {
    roleString = decoded.Role;
    
    switch (roleString.toLowerCase().trim()) {
      case 'admin':
        roleId = 1;
        break;
      case 'researcher':
        roleId = 2;
        break;
      case 'lab technician':
      case 'technician':
        roleId = 3;
        break;
      default:
        roleId = 2;
    }
  } else if (decoded.role && typeof decoded.role === 'string') {
    roleString = decoded.role;
    
    switch (roleString.toLowerCase().trim()) {
      case 'admin':
        roleId = 1;
        break;
      case 'researcher':
        roleId = 2;
        break;
      case 'lab technician':
      case 'technician':
        roleId = 3;
        break;
      default:
        roleId = 2;
    }
  }
  // PRIORITY 3: Fall back to numeric roleId only if no role string found
  else if (decoded.roleId && typeof decoded.roleId === 'number') {
    roleId = decoded.roleId;
    roleString = getRoleName(roleId);
  } else if (decoded.RoleId && typeof decoded.RoleId === 'number') {
    roleId = decoded.RoleId;
    roleString = getRoleName(roleId);
  } else if (decoded.role_id && typeof decoded.role_id === 'number') {
    roleId = decoded.role_id;
    roleString = getRoleName(roleId);
  } else if (decoded.role && typeof decoded.role === 'number') {
    roleId = decoded.role;
    roleString = getRoleName(roleId);
  } else if (decoded.Role && typeof decoded.Role === 'number') {
    roleId = decoded.Role;
    roleString = getRoleName(roleId);
  }
  
  const user: User = {
    id: decoded.sub || decoded.userID || decoded.UserID || email,
    email: email,
    name: decoded.name || decoded.Name || decoded.fullName || decoded.FullName || "User",
    phoneNumber: decoded.phoneNumber || decoded.PhoneNumber || "",
    roleId: roleId,
    role: roleString, 
    createdDate: decoded.createdDate || new Date().toISOString(),
    createdBy: decoded.createdBy,
    avatarUrl: decoded.avatarUrl || decoded.AvatarUrl,
  };
  
  return user;
}