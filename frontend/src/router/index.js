import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/admin",
  },
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
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
        path: "classrooms",
        name: "ClassroomManage",
        component: () => import("../views/admin/ClassroomManage.vue"),
      },
      {
        path: "schedule",
        name: "ScheduleManage",
        component: () => import("../views/admin/ScheduleManage.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
