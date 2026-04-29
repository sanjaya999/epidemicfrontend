import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import Cookies from "js-cookie";

const baseURL = process.env.NEXT_PUBLIC_API_URL;


interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>;
}


const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorData = error.response?.data;
    const message = errorData?.message || "An unexpected error occurred";

    if (error.response?.status === 401) {
      // Clear cookie using js-cookie
      Cookies.remove("access_token");
      // Optional: window.location.href = "/login";
    }

    // Show toast message for all errors except 401 on /users/me (expected for guest users)
    const isMeEndpoint = error.config?.url?.includes("/users/me");
    const isUnauthorized = error.response?.status === 401;

    if (!(isMeEndpoint && isUnauthorized)) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
