import axios from "axios";
import { ElMessage } from "element-plus";

// 创建axios实例
const request = axios.create({
  baseURL: "/", // 修改基础URL，因为API路径中已包含/api前缀
  timeout: 15000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 打印请求信息
    console.log("Request:", {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 打印响应信息
    console.log("Response:", {
      status: response.status,
      data: response.data,
    });

    const res = response.data;

    // 直接返回数据，让业务代码处理具体的响应结构
    return res;
  },
  (error) => {
    // 详细的错误处理
    console.error("Response Error:", error);
    let errorMsg = "网络错误";

    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      const data = error.response.data;

      console.error("Error Response:", {
        status,
        data,
        config: error.config,
      });

      switch (status) {
        case 400:
          errorMsg = data.message || data.error || "请求参数错误";
          break;
        case 401:
          errorMsg = "未授权，请登录";
          break;
        case 403:
          errorMsg = "拒绝访问";
          break;
        case 404:
          errorMsg = "请求地址不存在";
          break;
        case 500:
          errorMsg = "服务器内部错误";
          break;
        default:
          errorMsg = `请求失败: ${status}`;
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error("No Response:", error.request);
      errorMsg = "服务器无响应";
    } else {
      // 请求配置出错
      console.error("Request Config Error:", error.message);
      errorMsg = "请求配置错误";
    }

    // 不在这里显示错误消息，让业务代码处理
    return Promise.reject(new Error(errorMsg));
  }
);

export default request;
