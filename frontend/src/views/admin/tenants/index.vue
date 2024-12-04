<script setup>
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import axios from "axios"

const tenants = ref([])
const showCreateDialog = ref(false)
const loading = ref(false)

// 表单数据
const formData = ref({
  tenant: {
    name: "测试大学",
    code: "TEST",
    status: "trial",
    subscription: {
      plan: "professional",
    },
    contact: {
      name: "张主任",
      email: "zhangzr@test.edu",
      phone: "13800138000",
    },
  },
  admin: {
    username: "admin",
    password: "admin123",
    name: "张主任",
    email: "admin@test.edu",
    phone: "13800138000",
  },
  school: {
    name: "测试大学本部",
    code: "TEST-01",
    address: "测试市大学路1号",
    contact: {
      name: "李校长",
      phone: "13900139000",
      email: "principal@test.edu",
    },
    settings: {
      academicYear: {
        start: new Date().toISOString().split('T')[0], // 今天
        end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 明年今天
      },
    },
  },
})

// 获取租户列表
const fetchTenants = async () => {
  try {
    const { data } = await axios.get("/api/tenants")
    tenants.value = Array.isArray(data) ? data : []
    console.log("获取到的租户列表:", tenants.value)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "获取租户列表失败")
  }
}

// 创建租户
const createTenant = async () => {
  try {
    loading.value = true
    const { data } = await axios.post("/api/tenants", formData.value)
    ElMessage.success("租户创建成功")
    showCreateDialog.value = false
    await fetchTenants()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "创建租户失败")
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return "-"
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  fetchTenants()
})
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">租户管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">新建租户</el-button>
    </div>

    <!-- 租户列表 -->
    <div class="grid gap-4">
      <el-card v-for="tenant in tenants" :key="tenant._id" class="mb-4">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">{{ tenant.name }}</span>
            <span class="text-gray-500">代码: {{ tenant.code }}</span>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-medium mb-2">基本信息</h3>
            <div class="space-y-1 text-sm">
              <p>状态: {{
                {
                  'trial': '试用',
                  'active': '正式',
                  'inactive': '停用'
                }[tenant.status] || tenant.status
              }}</p>
              <p>订阅计划: {{
                {
                  'basic': '基础版',
                  'professional': '专业版',
                  'enterprise': '企业版'
                }[tenant.subscription?.plan] || tenant.subscription?.plan
              }}</p>
              <p>到期时间: {{ formatDate(tenant.subscription?.endDate) }}</p>
            </div>
          </div>
          <div>
            <h3 class="font-medium mb-2">联系方式</h3>
            <div class="space-y-1 text-sm">
              <p>联系人: {{ tenant.contact?.name || '-' }}</p>
              <p>电话: {{ tenant.contact?.phone || '-' }}</p>
              <p>邮箱: {{ tenant.contact?.email || '-' }}</p>
            </div>
          </div>
        </div>
      </el-card>
      <el-empty v-if="tenants.length === 0" description="暂无租户数据" />
    </div>

    <!-- 创建租户对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新租户" width="70%" :close-on-click-modal="false">
      <el-form @submit.prevent="createTenant" label-position="top">
        <!-- 租户信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4">租户信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="租户名称">
                <el-input v-model="formData.tenant.name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租户代码">
                <el-input v-model="formData.tenant.code" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订阅计划">
                <el-select v-model="formData.tenant.subscription.plan" class="w-full">
                  <el-option label="基础版" value="basic" />
                  <el-option label="专业版" value="professional" />
                  <el-option label="企业版" value="enterprise" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-select v-model="formData.tenant.status" class="w-full">
                  <el-option label="试用" value="trial" />
                  <el-option label="正式" value="active" />
                  <el-option label="停用" value="inactive" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系人">
                <el-input v-model="formData.tenant.contact.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话">
                <el-input v-model="formData.tenant.contact.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系邮箱">
                <el-input v-model="formData.tenant.contact.email" type="email" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 管理员信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4">管理员信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="formData.admin.username" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码">
                <el-input v-model="formData.admin.password" type="password" show-password />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="姓名">
                <el-input v-model="formData.admin.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="邮箱">
                <el-input v-model="formData.admin.email" type="email" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="手机">
                <el-input v-model="formData.admin.phone" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 学校信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4">学校信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学校名称">
                <el-input v-model="formData.school.name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学校代码">
                <el-input v-model="formData.school.code" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="地址">
                <el-input v-model="formData.school.address" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系人">
                <el-input v-model="formData.school.contact.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话">
                <el-input v-model="formData.school.contact.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系邮箱">
                <el-input v-model="formData.school.contact.email" type="email" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学年开始日期">
                <el-date-picker v-model="formData.school.settings.academicYear.start" type="date" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学年结束日期">
                <el-date-picker v-model="formData.school.settings.academicYear.end" type="date" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="flex justify-end gap-2">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createTenant" :loading="loading">
            创建
          </el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>