export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  userName: string | null;
  phoneNumber: string;
  roleID: number;
  role: string;
  create_at: string;
  create_by: string | null;
  avatarUrl: string | null;
}

export interface UserApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: User[];
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}
