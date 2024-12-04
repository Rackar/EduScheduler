import { useUserStore } from "@/stores/user";

export function setupRouteGuards(router) {
  const userStore = useUserStore();

  router.beforeEach(async (to, from, next) => {
    // 初始化用户状态
    if (!userStore.user.value && userStore.token.value) {
      try {
        await userStore.init();
      } catch (error) {
        console.error("初始化用户状态失败:", error);
        return next("/login");
      }
    }

    // 检查是否需要登录
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!userStore.isAuthenticated.value) {
        return next({
          path: "/login",
          query: { redirect: to.fullPath },
        });
      }
    }

    // 检查超级管理员权限
    if (to.matched.some((record) => record.meta.requiresSuperAdmin)) {
      if (!userStore.isSuperAdmin.value) {
        return next({
          path: "/403",
          replace: true,
        });
      }
    }

    // 检查租户管理员权限
    if (to.matched.some((record) => record.meta.requiresTenantAdmin)) {
      if (!userStore.isTenantAdmin.value) {
        return next({
          path: "/403",
          replace: true,
        });
      }
    }

    // 检查学校管理员权限
    if (to.matched.some((record) => record.meta.requiresSchoolAdmin)) {
      if (!userStore.isSchoolAdmin.value) {
        return next({
          path: "/403",
          replace: true,
        });
      }
    }

    next();
  });
}
