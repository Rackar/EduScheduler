<template>
  <div class="container mx-auto p-4">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <el-loading :fullscreen="false" />
    </div>

    <!-- 主要内容 -->
    <template v-else>
      <AutoScheduleDialog v-model="showAutoScheduleDialog" @success="handleScheduleSuccess" />

      <!-- 顶部操作栏 -->
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">排课管理</h1>
        <div class="space-x-2">
          <el-button type="primary" @click="showAutoScheduleDialog = true">
            自动排课
          </el-button>
          <el-button type="success" @click="handleExport">导出课表</el-button>
        </div>
      </div>

      <!-- 当前模板信息 -->
      <el-card class="mb-4">
        <template #header>
          <div class="flex justify-between items-center">
            <span v-if="!currentTemplate">请先设置学时模板</span>
            <span v-else>当前使用的学时模板：</span>
            <el-button type="primary" link @click="router.push('/admin/schedule-templates')">
              更换模板
            </el-button>
          </div>
        </template>
        <div v-if="currentTemplate">
          <p class="font-medium">{{ currentTemplate.name }}
            <span class="text-gray-500 pl-4">({{ currentTemplate.description }})</span>
          </p>
        </div>
      </el-card>

      <!-- 课程调整视图 -->
      <ScheduleAdjustView v-if="currentTemplate" :current-template="currentTemplate"
        @view-conflict="handleViewConflict" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import AutoScheduleDialog from "@/components/AutoScheduleDialog.vue"
import ScheduleAdjustView from "@/components/schedule/ScheduleAdjustView.vue"
import { getCurrentTemplate } from "@/api/schedule"

const router = useRouter()
const loading = ref(false)
const currentTemplate = ref(null)
const showAutoScheduleDialog = ref(false)

// 获取当前模板
const fetchCurrentTemplate = async () => {
  try {
    loading.value = true
    const { data } = await getCurrentTemplate()
    currentTemplate.value = data
  } catch (error) {
    console.error("获取当前模板失败:", error)
    ElMessage.error("获取当前模板失败")
  } finally {
    loading.value = false
  }
}

// 自动排课成功回调
const handleScheduleSuccess = () => {
  showAutoScheduleDialog.value = false
  ElMessage.success("排课成功")
}

// 导出课表
const handleExport = () => {
  // TODO: 实现导出功能
  ElMessage.info("导出功能开发中")
}

// 处理查看冲突课表
const handleViewConflict = (conflict) => {
  // TODO: 实现跳转到冲突课表
  console.log('查看冲突:', conflict)
}

// 页面加载时初始化数据
onMounted(() => {
  fetchCurrentTemplate()
})
</script>

<style scoped>
.el-table :deep(td) {
  height: 100px;
}
</style>