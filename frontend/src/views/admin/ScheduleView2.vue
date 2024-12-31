<template>
  <div class="container mx-auto p-4">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <el-loading :fullscreen="false" />
    </div>

    <!-- 主要内容 -->
    <template v-else>


      <!-- 视图模式切换 -->
      <div class="mb-4">
        <el-tabs v-model="currentViewMode" @tab-click="handleTabClick">
          <el-tab-pane label="教师课程视图" name="teacher">
            <TeacherScheduleView v-if="currentViewMode === 'teacher'" :current-template="currentTemplate" />
          </el-tab-pane>
          <el-tab-pane label="班级课程视图" name="class">
            <ClassScheduleView v-if="currentViewMode === 'class'" :current-template="currentTemplate" />
          </el-tab-pane>
          <el-tab-pane label="逐周视图" name="weekly">
            <WeeklyScheduleView v-if="currentViewMode === 'weekly'" :current-template="currentTemplate" />
          </el-tab-pane>
          <el-tab-pane label="统计分析" name="statistics">
            <ScheduleStatistics v-if="currentViewMode === 'statistics'" ref="statisticsRef" />
          </el-tab-pane>
        </el-tabs>
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
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { getCurrentTemplate } from "@/api/schedule"
import WeeklyScheduleView from "@/components/schedule/WeeklyScheduleView.vue"
import ClassScheduleView from "@/components/schedule/ClassScheduleView.vue"
import TeacherScheduleView from "@/components/schedule/TeacherScheduleView.vue"
import ScheduleStatistics from "@/components/schedule/ScheduleStatistics.vue"

// 视图模式
const VIEW_MODES = {
  WEEKLY: "weekly",     // 逐周视图
  CLASS_FULL: "class",  // 班级全课程视图
  TEACHER_FULL: "teacher", // 教师全课程视图
  STATISTICS: "statistics" // 统计分析视图
}

const router = useRouter()
const loading = ref(false)
const currentTemplate = ref(null)
const currentViewMode = ref(VIEW_MODES.TEACHER_FULL)
const statisticsRef = ref(null)

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

// 处理标签页切换
const handleTabClick = async (tab) => {
  if (tab.props.name === "statistics") {
    // 等待下一个 tick，确保组件已经挂载
    await nextTick()
    // 刷新统计图表
    await statisticsRef.value?.refresh()
  }
}

// 组件挂载时初始化数据
onMounted(() => {
  fetchCurrentTemplate()
})
</script>