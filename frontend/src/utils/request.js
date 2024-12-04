import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";

// 创建axios实例
const request = axios.create({
  baseURL: "/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("响应错误:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(new Error("登录已过期，请重新登录"));
    }
    ElMessage.error(error.response?.data?.message || "请求失败");
    return Promise.reject(error);
  }
);

export default request;
