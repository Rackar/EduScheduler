<template>
  <div class="container mx-auto p-6">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">个人信息</h1>

      <el-card class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <span>基本信息</span>
            <el-button type="primary" @click="handleSave" :loading="loading">
              保存修改
            </el-button>
          </div>
        </template>

        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
          <el-form-item label="用户名">
            <el-input v-model="formData.username" disabled />
          </el-form-item>

          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card>
        <template #header>
          <div class="flex items-center justify-between">
            <span>修改密码</span>
            <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading">
              确认修改
            </el-button>
          </div>
        </template>

        <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input v-model="passwordForm.currentPassword" type="password" show-password />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { useUserStore } from "@/stores/user"
import axios from "axios"

const userStore = useUserStore()

const formRef = ref(null)
const passwordFormRef = ref(null)
const loading = ref(false)
const passwordLoading = ref(false)

const formData = ref({
  username: "",
  name: "",
  email: "",
  phone: "",
})

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
})

const rules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" },
  ],
}

const validatePass = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请输入密码"))
  } else {
    if (passwordForm.value.confirmPassword !== "") {
      passwordFormRef.value?.validateField("confirmPassword")
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请再次输入密码"))
  } else if (value !== passwordForm.value.newPassword) {
    callback(new Error("两次输入密码不一致!"))
  } else {
    callback()
  }
}

const passwordRules = {
  currentPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
  ],
  newPassword: [
    { required: true, trigger: "blur", validator: validatePass },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, trigger: "blur", validator: validatePass2 },
  ],
}

// 获取用户信息
onMounted(async () => {
  const user = userStore.user.value
  formData.value = {
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  }
})

// 保存基本信息
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await axios.put("/api/users/me", formData.value)
    await userStore.fetchUserInfo()
    ElMessage.success("保存成功")
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error(error.response?.data?.message || "保存失败")
  } finally {
    loading.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true

    await axios.put("/api/users/me/password", {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })

    ElMessage.success("密码修改成功")
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  } catch (error) {
    console.error("修改密码失败:", error)
    ElMessage.error(error.response?.data?.message || "修改密码失败")
  } finally {
    passwordLoading.value = false
  }
}
</script>