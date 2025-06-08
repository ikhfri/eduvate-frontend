// lms-frontend/lib/axiosInstance.ts
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios"; // Import tipe Axios

const axiosInstance: AxiosInstance = axios.create({
  // Tambahkan tipe AxiosInstance
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tambahkan tipe
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    // Tambahkan tipe
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Tambahkan tipe
    return response;
  },
  (error: AxiosError) => {
    // Tambahkan tipe
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - 401. Mungkin token kadaluarsa.");
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
