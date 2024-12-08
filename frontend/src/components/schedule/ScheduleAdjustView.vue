<template>
  <div class="flex gap-4">
    <!-- 左侧课表区域 -->
    <div class="w-4/5">
      <!-- 筛选条件 -->
      <div class="mb-4 flex space-x-4">
        <el-select v-model="currentClass" placeholder="选择班级" @change="handleClassChange">
          <el-option v-for="cls in classes" :key="cls.id || cls._id" :label="cls.name" :value="cls.id || cls._id" />
        </el-select>
      </div>

      <!-- 课表 -->
      <el-table :data="scheduleTableData" border>
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column v-for="day in ['周一', '周二', '周三', '周四', '周五']" :key="day" :label="day">
          <template #default="{ row, column }">
            <!-- 课程单元格 -->
            <div class="min-h-[100px] p-2 relative" :class="{ 'bg-gray-50': isDragTarget(row, column) }"
              @dragover.prevent="handleDragOver($event, row, column)" @drop.prevent="handleDrop($event, row, column)">

              <!-- 课程内容 -->
              <template v-if="Array.isArray(row[day])">
                <div v-for="schedule in row[day]" :key="schedule.id"
                  class="p-2 rounded cursor-move relative mb-2 last:mb-0" :class="[
                    getCellClass(schedule),
                    {
                      'border-2 border-dashed border-green-500': isTargetSchedule(schedule),
                      'border-2 border-dashed border-red-500': isConflictSchedule(schedule)
                    }
                  ]" draggable="true" @dragstart="handleDragStart($event, schedule, row, column)"
                  @dragend="handleDragEnd">
                  <p class="font-medium">{{ schedule.courseName }}</p>
                  <p class="text-sm">{{ schedule.teacherName }}</p>
                  <p class="text-xs text-gray-500">({{ formatWeeks(schedule.weeks) }})</p>
                </div>
              </template>

              <!-- 拖拽提示 -->
              <div v-if="isDragTarget(row, column)" class="absolute inset-0 border-2 border-dashed"
                :class="{ 'border-green-500': !hasConflict, 'border-red-500': hasConflict }">
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 右侧冲突列表 -->
    <div v-if="conflictList.length > 0" class="w-1/5 border-l">
      <div class="p-4">
        <div class="text-lg font-medium mb-4">待处理冲突 ({{ conflictList.length }})</div>
        <div class="space-y-4">
          <div v-for="(conflict, index) in conflictList" :key="index"
            class="p-4 bg-red-50 rounded border border-red-200">
            <div class="font-medium text-red-700 mb-2">
              {{ conflict.type === 'teacher' ? '教师时间冲突' : '班级时间冲突' }}
            </div>
            <div class="text-sm space-y-1">
              <p>课程：{{ conflict.schedule.courseName }}</p>
              <p>教师：{{ conflict.schedule.teacherName }}</p>
              <p>班级：{{ conflict.schedule.className }}</p>
              <p>时间：周{{ conflict.originalDay }}第{{ getTimeSlotName(conflict.originalTimeSlot) }}节</p>
              <p>周次：{{ formatWeeks(conflict.schedule.weeks) }}</p>
              <div class="mt-2 text-xs text-gray-500">
                请将此课程拖拽到其他时段
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { getClassList } from "@/api/class"
import { getClassScheduleFull, checkScheduleConflicts, updateScheduleTime } from "@/api/schedule"
import { getCellClass, convertToTableData, formatWeeks, mergeScheduleWeeks } from "@/utils/schedule"

const props = defineProps({
  currentTemplate: {
    type: Object,
    required: true
  }
})

// 状态变量
const currentClass = ref("")
const classes = ref([])
const scheduleData = ref([])
const loading = ref(false)
const draggingSchedule = ref(null)
const dragTarget = ref(null)
const conflictList = ref([])
const targetSchedule = ref(null)
const hasConflict = ref(false)

// 计算课表数据
const scheduleTableData = computed(() => {
  const mergedSchedules = mergeScheduleWeeks(scheduleData.value)
  return convertToTableData(props.currentTemplate, mergedSchedules)
})

// 获取班级列表
const fetchClasses = async () => {
  try {
    const { data } = await getClassList()
    classes.value = data.filter(cls => cls.status === "active").map(cls => ({
      ...cls,
      id: cls.id || cls._id
    }))
    if (classes.value.length > 0) {
      currentClass.value = classes.value[0].id || classes.value[0]._id
      handleClassChange()
    }
  } catch (error) {
    console.error("获取班级列表失败:", error)
    ElMessage.error("获取班级列表失败")
  }
}

// 获取课表数据
const fetchSchedules = async () => {
  if (!currentClass.value) return

  try {
    loading.value = true
    const response = await getClassScheduleFull({
      classId: currentClass.value
    })

    scheduleData.value = response.data.data.map(schedule => ({
      id: schedule._id,
      timeSlotId: schedule.timeSlotId,
      dayOfWeek: schedule.dayOfWeek,
      courseName: schedule.courseId?.name || "未知课程",
      teacherName: schedule.teacherId?.name || "未知教师",
      status: schedule.status || "draft",
      weeks: schedule.weeks || []
    }))
  } catch (error) {
    console.error("获取课表失败:", error)
    ElMessage.error("获取课表失败")
    scheduleData.value = []
  } finally {
    loading.value = false
  }
}

// 班级变更处理
const handleClassChange = () => {
  fetchSchedules()
  conflictList.value = []
}

// 拖拽开始
const handleDragStart = (event, schedule, row, column) => {
  draggingSchedule.value = {
    schedule,
    sourceTimeSlot: row.timeSlotId,
    sourceDay: getDayNumber(column.label)
  }
  event.dataTransfer.effectAllowed = "move"
}

// 拖拽结束
const handleDragEnd = () => {
  draggingSchedule.value = null
  dragTarget.value = null
  hasConflict.value = false
}

// 拖拽悬停
const handleDragOver = (event, row, column) => {
  if (!draggingSchedule.value) return
  dragTarget.value = {
    timeSlotId: row.timeSlotId,
    day: getDayNumber(column.label)
  }
}

// 拖拽放置
const handleDrop = async (event, row, column) => {
  if (!draggingSchedule.value || !dragTarget.value) return

  const { schedule: sourceSchedule, sourceTimeSlot, sourceDay } = draggingSchedule.value
  const { timeSlotId: targetTimeSlot, day: targetDay } = dragTarget.value

  // 检查是否有变化
  if (sourceSchedule.timeSlotId === targetTimeSlot && targetDay === sourceSchedule.dayOfWeek) {
    return
  }

  try {
    // 获取目标位置的课程
    const targetCell = row[column.label]

    // 检查冲突
    const response = await checkScheduleConflicts({
      scheduleId: sourceSchedule.id,
      targetTimeSlot,
      targetDay
    })

    if (response.data.data.length > 0) {
      // 如果目标位置有课程，将其加入冲突列表
      if (targetCell && Array.isArray(targetCell)) {
        targetCell.forEach(schedule => {
          // 检查是否已在冲突列表中
          const existingConflict = conflictList.value.find(
            conflict => conflict.schedule.id === schedule.id
          )
          if (!existingConflict) {
            conflictList.value.push({
              type: response.data.data[0].type,
              schedule: {
                ...schedule,
                className: row[column.label]?.className || "未知班级"
              },
              originalTimeSlot: targetTimeSlot,
              originalDay: targetDay
            })
          }
        })
      }

      // 更新目标课程状态
      targetSchedule.value = sourceSchedule
      hasConflict.value = true
    }

    // 更新源课程位置
    await updateSchedulePosition(sourceSchedule.id, targetTimeSlot, targetDay)

  } catch (error) {
    console.error("处理课程拖拽失败:", error)
    ElMessage.error("处理课程拖拽失败")
  }
}

// 更新课程位置
const updateSchedulePosition = async (scheduleId, timeSlotId, day) => {
  try {
    loading.value = true
    await updateScheduleTime({
      scheduleId,
      newTimeSlot: timeSlotId,
      newDay: day
    })
    ElMessage.success("课程调整成功")
    // 刷新数据
    await fetchSchedules()
    // 检查并更新冲突列表
    await updateConflictList()
  } catch (error) {
    console.error("更新课程时间失败:", error)
    ElMessage.error("更新课程时间失败")
  } finally {
    loading.value = false
  }
}

// 判断是否为目标课程
const isTargetSchedule = (schedule) => {
  return targetSchedule.value?.id === schedule.id
}

// 判断是否为冲突课程
const isConflictSchedule = (schedule) => {
  return conflictList.value.some(conflict => conflict.schedule.id === schedule.id)
}

// 判断是否为拖拽目标
const isDragTarget = (row, column) => {
  if (!dragTarget.value) return false
  return dragTarget.value.timeSlotId === row.timeSlotId &&
    dragTarget.value.day === getDayNumber(column.label)
}

// 获取星期几对应的数字
const getDayNumber = (dayLabel) => {
  const dayMap = {
    "周一": 1,
    "周二": 2,
    "周三": 3,
    "周四": 4,
    "周五": 5
  }
  return dayMap[dayLabel] || 1
}

// 获取时间段名称
const getTimeSlotName = (timeSlotId) => {
  const timeSlot = props.currentTemplate?.periods?.morning?.find(p => p.id === timeSlotId) ||
    props.currentTemplate?.periods?.afternoon?.find(p => p.id === timeSlotId) ||
    props.currentTemplate?.periods?.evening?.find(p => p.id === timeSlotId)
  return timeSlot?.name || '未知'
}

// 检查课程是否仍然冲突
const checkScheduleStillConflicts = async (schedule) => {
  try {
    const response = await checkScheduleConflicts({
      scheduleId: schedule.id,
      targetTimeSlot: schedule.timeSlotId,
      targetDay: schedule.dayOfWeek
    })
    return response.data.data.length > 0
  } catch (error) {
    console.error("检查冲突状态失败:", error)
    return true // 如果检查失败，保守起见认为仍然冲突
  }
}

// 更新冲突列表和样式
const updateConflictList = async () => {
  const newConflictList = []
  for (const conflict of conflictList.value) {
    const stillConflicts = await checkScheduleStillConflicts(conflict.schedule)
    if (stillConflicts) {
      newConflictList.push(conflict)
    }
  }

  // 如果冲突列表发生变化，更新相关状态
  if (newConflictList.length !== conflictList.value.length) {
    conflictList.value = newConflictList
    // 如果没有冲突了，清除所有状态
    if (newConflictList.length === 0) {
      targetSchedule.value = null
      hasConflict.value = false
    }
  }
}

// 页面加载时初始化数据
onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.el-table :deep(td) {
  height: 100px;
  padding: 0;
}
</style>