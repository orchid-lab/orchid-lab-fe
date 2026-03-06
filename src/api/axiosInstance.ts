import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

const axiosInstance = axios.create({
  baseURL: "https://net-api.tissuex.me/",
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

    // Check if error is 401 and not refresh endpoint itself
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error("No refresh token found");
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }

      try {
        const response = await axiosInstance.post<RefreshTokenResponse>(
          "/api/authentication/refresh-token",
          JSON.stringify(refreshToken),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Refresh token success:", response.data);

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error("Invalid refresh token response - missing tokens");
        }

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
      
        localStorage.clear();
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
