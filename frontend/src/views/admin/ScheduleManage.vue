<template>
  <div class="container mx-auto p-4">
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
    <el-alert v-if="!currentTemplate" type="warning" :closable="false" class="mb-4">
      请先在作息时间模板管理中设置当前使用的模板
    </el-alert>
    <el-card v-else class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span>当前使用的作息时间模板</span>
          <el-button type="primary" link @click="router.push('/admin/schedule-templates')">
            更换模板
          </el-button>
        </div>
      </template>
      <div>
        <p class="font-medium">{{ currentTemplate.name }}</p>
        <p class="text-gray-500">{{ currentTemplate.description }}</p>
      </div>
    </el-card>

    <!-- 课表展示 -->
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>课表</span>
          <div class="space-x-2">
            <el-select v-model="currentWeek" placeholder="选择周次">
              <el-option v-for="week in weekOptions" :key="week" :label="`第${week}周`" :value="week" />
            </el-select>
            <el-select v-model="currentClass" placeholder="选择班级">
              <el-option v-for="cls in classes" :key="cls._id" :label="cls.name" :value="cls._id" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="scheduleTableData" border>
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column v-for="day in ['周一', '周二', '周三', '周四', '周五']" :key="day" :label="day">
          <template #default="{ row }">
            <div v-if="row[day]" class="p-2 rounded" :class="getCellClass(row[day])">
              <p class="font-medium">{{ row[day].courseName }}</p>
              <p class="text-sm">{{ row[day].teacherName }}</p>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 自动排课对话框 -->
    <AutoScheduleDialog v-model="showAutoScheduleDialog" :template="currentTemplate" @success="handleScheduleSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import AutoScheduleDialog from "@/components/AutoScheduleDialog.vue"
import { getClasses } from "@/api/class"
import { getSchedules } from "@/api/schedule"
import { getCurrentTemplate } from "@/api/schedule"

const router = useRouter()
const currentTemplate = ref(null)
const showAutoScheduleDialog = ref(false)
const currentWeek = ref(1)
const currentClass = ref("")
const classes = ref([])
const schedules = ref([])

// 周次选项
const weekOptions = computed(() => {
  return Array.from({ length: 20 }, (_, i) => i + 1)
})

// 获取当前模板
const fetchCurrentTemplate = async () => {
  try {
    const { data } = await getCurrentTemplate()
    currentTemplate.value = data
  } catch (error) {
    console.error("获取当前模板失败:", error)
    ElMessage.error("获取当前模板失败")
  }
}

// 获取班级列表
const fetchClasses = async () => {
  try {
    const { data } = await getClasses()
    classes.value = data
    if (data.length > 0) {
      currentClass.value = data[0]._id
    }
  } catch (error) {
    console.error("获取班级列表失败:", error)
    ElMessage.error("获取班级列表失败")
  }
}

// 获取课表数据
const fetchSchedules = async () => {
  if (!currentClass.value || !currentWeek.value) return

  try {
    const { data } = await getSchedules({
      classId: currentClass.value,
      week: currentWeek.value
    })
    schedules.value = data
  } catch (error) {
    console.error("获取课表失败:", error)
    ElMessage.error("获取课表失败")
  }
}

// 转换课表数据为表格格式
const scheduleTableData = computed(() => {
  if (!currentTemplate.value) return []

  const timeSlots = currentTemplate.value.timeSlots
  return timeSlots.map(slot => {
    const row = {
      time: `${slot.startTime}-${slot.endTime}\n${slot.name}`,
    }

      // 添加每天的课程
      ;["周一", "周二", "周三", "周四", "周五"].forEach((day, index) => {
        const schedule = schedules.value.find(s =>
          s.timeSlotId === slot._id &&
          s.day === index + 1
        )

        if (schedule) {
          row[day] = {
            courseName: schedule.courseName,
            teacherName: schedule.teacherName,
            status: schedule.status
          }
        }
      })

    return row
  })
})

// 获取单元格样式
const getCellClass = (cell) => {
  if (!cell) return ""

  const baseClass = "bg-opacity-20"
  switch (cell.status) {
    case "draft":
      return `${baseClass} bg-blue-500`
    case "confirmed":
      return `${baseClass} bg-green-500`
    case "conflict":
      return `${baseClass} bg-red-500`
    default:
      return baseClass
  }
}

// 自动排课成功回调
const handleScheduleSuccess = () => {
  fetchSchedules()
  showAutoScheduleDialog.value = false
  ElMessage.success("排课成功")
}

// 导出课表
const handleExport = () => {
  // TODO: 实现导出功能
  ElMessage.info("导出功能开发中")
}

// 监听筛选条件变化
watch([currentWeek, currentClass], () => {
  fetchSchedules()
})

onMounted(() => {
  fetchCurrentTemplate()
  fetchClasses()
})
</script>

<style scoped>
.el-table :deep(td) {
  height: 100px;
}
</style>