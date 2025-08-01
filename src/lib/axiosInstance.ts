// lms-frontend/lib/axiosInstance.ts
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

// Ganti 'authToken' dengan nama yang lebih spesifik jika memungkinkan
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
});

// 1. Interceptor untuk menambahkan Access Token ke setiap permintaan
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 2. Interceptor untuk menangani respons, terutama error
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Cek jika error adalah 401 dan ini BUKAN percobaan ulang
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Tandai sebagai percobaan ulang

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          console.error("Refresh token tidak ditemukan, logout.");
          // Panggil fungsi logout global Anda di sini jika ada
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem("authUser");
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(error);
        }

        // Panggil endpoint untuk mendapatkan access token baru
        const response = await axios.post(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken: newAccessToken } = response.data;

        // Simpan token baru
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

        // Perbarui header di instance Axios untuk permintaan selanjutnya
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // Perbarui header di permintaan yang gagal tadi
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }

        // Ulangi permintaan yang gagal dengan token baru
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Jika refresh token juga gagal, logout pengguna
        console.error("Gagal me-refresh token, sesi berakhir.", refreshError);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem("authUser");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Untuk error selain 401, langsung tolak
    return Promise.reject(error);
  }
);

export default axiosInstance;
