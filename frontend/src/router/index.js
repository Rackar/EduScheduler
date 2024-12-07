import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/admin",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/auth/Login.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/admin/teachers",
      },
      {
        path: "teachers",
        name: "TeacherManage",
        component: () => import("../views/admin/TeacherManage.vue"),
      },
      {
        path: "courses",
        name: "CourseManage",
        component: () => import("../views/admin/CourseManage.vue"),
      },
      {
        path: "classes",
        name: "ClassManage",
        component: () => import("../views/admin/ClassManage.vue"),
      },
      {
        path: "classrooms",
        name: "ClassroomManage",
        component: () => import("../views/admin/ClassroomManage.vue"),
      },
      {
        path: "schedule",
        name: "ScheduleManage",
        component: () => import("../views/admin/ScheduleManage.vue"),
      },
      {
        path: "schedule-view",
        name: "ScheduleView",
        component: () => import("../views/admin/ScheduleView2.vue"),
      },
      {
        path: "schedule-templates",
        name: "ScheduleTemplates",
        component: () => import("../views/admin/schedule-templates/index.vue"),
      },
      {
        path: "schedule-templates/new",
        name: "NewScheduleTemplate",
        component: () => import("../views/admin/schedule-templates/edit.vue"),
      },
      {
        path: "schedule-templates/:id/edit",
        name: "EditScheduleTemplate",
        component: () => import("../views/admin/schedule-templates/edit.vue"),
      },
      {
        path: "tenants",
        name: "TenantManage",
        component: () => import("../views/admin/tenants/index.vue"),
        meta: { requiresSuperAdmin: true },
      },
      {
        path: "profile",
        name: "UserProfile",
        component: () => import("../views/admin/UserProfile.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/error/404.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
