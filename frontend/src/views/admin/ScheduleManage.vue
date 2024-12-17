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
        <div class="space-x-2">
          <el-button type="primary" @click="showAutoScheduleDialog = true">
            自动排课
          </el-button>
          <el-button type="primary" :loading="optimizing" @click="handleOptimize">
            <el-icon>
              <Refresh />
            </el-icon>
            优化日期课程分布
          </el-button>
          <el-button type="danger" :loading="clearing" @click="handleClearSchedule">
            <el-icon>
              <Delete />
            </el-icon>
            清除排课
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
      <ScheduleAdjustView v-if="currentTemplate" :current-template="currentTemplate" @view-conflict="handleViewConflict"
        ref="scheduleAdjustRef" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import AutoScheduleDialog from "@/components/AutoScheduleDialog.vue"
import ScheduleAdjustView from "@/components/schedule/ScheduleAdjustView.vue"
import { getCurrentTemplate } from "@/api/schedule"
import { Refresh, Delete } from "@element-plus/icons-vue"
import { optimizeSchedule, clearSchedule } from "@/api/schedule"

const router = useRouter()
const loading = ref(false)
const currentTemplate = ref(null)
const showAutoScheduleDialog = ref(false)
const optimizing = ref(false)
const clearing = ref(false)
const scheduleAdjustRef = ref(null)

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
const handleScheduleSuccess = async () => {
  showAutoScheduleDialog.value = false
  // ElMessage.success("排课成功")
  // 刷新课表视图
  await fetchCurrentTemplate()
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

// 优化课程分布
const handleOptimize = async () => {
  try {
    optimizing.value = true

    // 调用优化API
    const { data } = await optimizeSchedule({
      maxIterations: 1000,
      targetBalance: 0.1,
      weightDayBalance: 0.4,
      weightTeacherBalance: 0.3,
      weightPeriodBalance: 0.3,
      maxDailyLessons: 8,
      maxConsecutive: 2
    })

    if (data.result?.improvements > 0) {
      ElMessage.success(`优化完成，共调整 ${data.result.improvements} 处课程`)
      // 刷新课表数据
      await scheduleAdjustRef.value?.refreshSchedules()
    } else {
      ElMessage.info("当前课表分布已经很均衡，无需调整")
    }
  } catch (error) {
    console.error("优化课程分布失败:", error)
    ElMessage.error("优化课程分布失败")
  } finally {
    optimizing.value = false
  }
}

// 清除排课处理
const handleClearSchedule = async () => {
  try {
    await ElMessageBox.confirm("确定要清除所有排课结果吗？此操作不可恢复！", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    clearing.value = true
    const { data } = await clearSchedule()
    ElMessage.success(`清除成功，共删除 ${data.deletedCount} 条排课记录`)

    // 刷新课表数据
    await scheduleAdjustRef.value?.refreshSchedules()
  } catch (error) {
    if (error !== "cancel") {
      console.error("清除排课失败:", error)
      ElMessage.error("清除排课失败")
    }
  } finally {
    clearing.value = false
  }
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