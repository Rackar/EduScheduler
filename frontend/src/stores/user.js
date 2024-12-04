import { ref, computed } from "vue";
import axios from "axios";

// 从 localStorage 获取初始状态
const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

const user = ref(storedUser ? JSON.parse(storedUser) : null);
const token = ref(storedToken);

// 如果有token，设置axios默认headers
if (token.value) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
}

// 计算属性
const isAuthenticated = computed(() => !!token.value);
const isSuperAdmin = computed(() => user.value?.roles?.includes("super_admin"));
const isTenantAdmin = computed(() =>
  user.value?.roles?.includes("tenant_admin")
);
const isSchoolAdmin = computed(() =>
  user.value?.roles?.includes("school_admin")
);

// 更新用户状态
const updateUserState = (userData) => {
  console.log("更新用户状态:", userData);
  user.value = userData;
  localStorage.setItem("user", JSON.stringify(userData));
};

// 用户相关的方法
const login = async (username, password) => {
  try {
    const { data } = await axios.post("/api/users/login", {
      username,
      password,
    });
    console.log("登录返回的用户数据:", data);
    token.value = data.token;
    updateUserState(data.user);
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    return data;
  } catch (error) {
    throw error;
  }
};

const logout = () => {
  token.value = null;
  updateUserState(null);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete axios.defaults.headers.common["Authorization"];
};

const fetchUserInfo = async () => {
  try {
    const { data } = await axios.get("/api/users/me");
    console.log("获取用户信息返回的数据:", data);
    updateUserState(data);
    return data;
  } catch (error) {
    throw error;
  }
};

// 初始化用户状态
const init = async () => {
  if (token.value) {
    try {
      await fetchUserInfo();
    } catch (error) {
      console.error("初始化用户状态失败:", error);
      logout();
      throw error;
    }
  }
};

export const useUserStore = () => {
  return {
    user,
    token,
    isAuthenticated,
    isSuperAdmin,
    isTenantAdmin,
    isSchoolAdmin,
    login,
    logout,
    fetchUserInfo,
    init,
  };
};
