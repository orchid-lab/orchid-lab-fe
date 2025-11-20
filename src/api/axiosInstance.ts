import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

const axiosInstance = axios.create({
  baseURL: "https://net-api.orchid-lab.systems",
});

// Request interceptor: Gắn accessToken vào header nếu có
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Queue logic cho refresh token ---
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) {
        prom.config.headers = prom.config.headers || {};
        prom.config.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(axiosInstance(prom.config));
    }
  });
  failedQueue = [];
}

// Response interceptor: Tự động refresh token khi 401
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đợi kết quả
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      try {
        const response = await axiosInstance.post<RefreshTokenResponse>(
          "/api/user/refresh-token",
          { refreshToken }
        );
        console.log("Refresh token response:", response);
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        processQueue(err, null);
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
