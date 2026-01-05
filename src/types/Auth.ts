export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role: string; 
  createdDate?: string; 
  createdBy?: string;
  deletedDate?: string;
  deletedBy?: string;
  updatedDate?: string;
  updatedBy?: string;
  avatarUrl?: string;
}

export interface UserApiResponse {
  data: User[];
  totalCount: number;
  pageCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}