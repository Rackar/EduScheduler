<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">排课系统</h2>
        <p class="mt-2 text-sm text-gray-600">请登录您的账号</p>
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <el-form-item prop="username">
          <el-input v-model="formData.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="formData.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>

        <div class="flex items-center justify-between">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>

        <el-form-item>
          <el-button type="primary" native-type="submit" class="w-full" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter, useRoute } from "vue-router"
import { ElMessage } from "element-plus"
import { User, Lock } from "@element-plus/icons-vue"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const formData = ref({
  username: "",
  password: "",
})

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名至少3个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少6个字符", trigger: "blur" },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await userStore.login(formData.value.username, formData.value.password)

    // 如果有重定向地址，跳转到重定向地址
    const redirectPath = route.query.redirect || "/admin"
    router.push(redirectPath)

    ElMessage.success("登录成功")
  } catch (error) {
    console.error("登录失败:", error)
    ElMessage.error(error.response?.data?.message || "登录失败，请检查用户名和密码")
  } finally {
    loading.value = false
  }
}
</script>