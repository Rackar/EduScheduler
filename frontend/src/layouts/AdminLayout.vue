<template>
  <el-container class="h-screen">
    <el-aside width="200px" class="bg-gray-800">
      <div class="p-4 text-white text-xl font-bold">EduS排课系统</div>
      <el-menu class="border-none" background-color="#1F2937" text-color="#fff" active-text-color="#409EFF"
        :router="true" :default-active="route.path">
        <el-menu-item index="/admin/teachers">
          <el-icon>
            <User />
          </el-icon>
          <span>教师管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/courses">
          <el-icon>
            <Reading />
          </el-icon>
          <span>课程管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/classes">
          <el-icon>
            <Collection />
          </el-icon>
          <span>班级管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/classrooms">
          <el-icon>
            <School />
          </el-icon>
          <span>教室管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/schedule">
          <el-icon>
            <Calendar />
          </el-icon>
          <span>排课管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/schedule-view">
          <el-icon>
            <View />
          </el-icon>
          <span>课表查看</span>
        </el-menu-item>
        <el-menu-item index="/admin/schedule-templates">
          <el-icon>
            <Timer />
          </el-icon>
          <span>学时模板</span>
        </el-menu-item>
        <el-menu-item v-if="isSuperAdmin" index="/admin/tenants">
          <el-icon>
            <Management />
          </el-icon>
          <span>租户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="bg-white border-b flex items-center justify-between px-4">
        <div class="text-lg">{{ pageTitle }}</div>
        <el-dropdown @command="handleCommand">
          <span class="flex items-center cursor-pointer">
            <el-avatar size="small" class="mr-2">{{ currentUserName[0] || "用" }}</el-avatar>
            <span>{{ currentUserName }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="bg-gray-100">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import {
  User,
  Reading,
  School,
  Calendar,
  Timer,
  Management,
  Collection,
  View,
} from "@element-plus/icons-vue"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isSuperAdmin = computed(() => userStore.isSuperAdmin.value)

// 计算用户显示名称
const currentUserName = computed(() => {
  console.log("当前用户数据:", userStore.user.value)
  return userStore.user.value?.name || userStore.user.value?.username || "用户"
})

const pageTitle = computed(() => {
  const pathMap = {
    "/admin/teachers": "教师管理",
    "/admin/courses": "课程管理",
    "/admin/classrooms": "教室管理",
    "/admin/schedule": "排课管理",
    "/admin/schedule-view": "课表查看",
    "/admin/schedule-templates": "学时模板管理",
    "/admin/tenants": "租户管理",
  }
  return pathMap[route.path] || "管理系统"
})

const handleCommand = async (command) => {
  if (command === "logout") {
    await userStore.logout()
    router.push("/login")
  } else if (command === "profile") {
    router.push("/admin/profile")
  }
}
</script>

<style scoped>
.el-aside {
  @apply border-r;
}

.el-header {
  @apply h-16 leading-[4rem];
}
</style>