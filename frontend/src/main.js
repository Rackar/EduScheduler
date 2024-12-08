import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { setupRouteGuards } from "./router/guard";
import { useUserStore } from "./stores/user";

const app = createApp(App);

// 初始化用户状态
const userStore = useUserStore();

// 方案1：使用异步函数包装
const initApp = async () => {
  await userStore.init();

  app.mount("#app");
};

initApp();
