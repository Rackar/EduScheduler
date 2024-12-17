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
              {{ getConflictTypeText(conflict.type) }}
            </div>
            <div class="text-sm space-y-1">
              <p>课程：{{ conflict.schedule.courseName }}</p>
              <p>教师：{{ conflict.schedule.teacherName }}</p>
              <p>
                班级：
                <el-button type="primary" link @click="switchToClass(conflict.schedule.classId)">
                  {{ conflict.schedule.className }}
                </el-button>
              </p>
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
import { ElMessage, ElMessageBox } from "element-plus"
import { Refresh, Delete } from "@element-plus/icons-vue"
import { getClassList } from "@/api/class"
import {
  getClassScheduleFull,
  checkScheduleConflicts,
  updateScheduleTime,
  getTeacherScheduleFull,
  optimizeSchedule,
  clearSchedule
} from "@/api/schedule"
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

    // 转换数据格式
    scheduleData.value = response.data.data.map(schedule => ({
      id: schedule._id,
      timeSlotId: schedule.timeSlotId,
      dayOfWeek: schedule.dayOfWeek,
      courseName: schedule.courseId?.name || "未知课程",
      teacherName: schedule.teacherId?.name || "未知教师",
      teacherId: schedule.teacherId?._id || schedule.teacherId, // 添加教师ID
      className: schedule.classId?.name || "未知班级",
      classId: schedule.classId?._id || schedule.classId,
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
  try {
    event.dataTransfer.setData('text/plain', schedule.id)
  } catch (e) {
    // 忽略设置数据失败的错误
    console.warn('设置拖拽数据失败，但不影响功能')
  }
}

// 拖拽结束
const handleDragEnd = () => {
  draggingSchedule.value = null
  dragTarget.value = null
  hasConflict.value = false
}

// 拖拽悬停
const handleDragOver = (event, row, column) => {
  event.preventDefault()
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

    // 检查当前班级的冲突
    const response = await checkScheduleConflicts({
      scheduleId: sourceSchedule.id,
      targetTimeSlot,
      targetDay
    })

    // 获取教师ID
    const teacherId = sourceSchedule.teacherId
    if (!teacherId) {
      console.warn("课程缺少教师ID:", sourceSchedule)
    } else {
      console.log("当前课程教师ID:", teacherId)
    }

    // 检查教师在其他班级的冲突
    let teacherConflicts = []
    if (teacherId) {
      teacherConflicts = await checkTeacherOtherClassConflicts(
        teacherId,
        targetTimeSlot,
        targetDay,
        sourceSchedule.weeks,
        sourceSchedule.id
      )
    }

    // 合并所有冲突
    const allConflicts = [
      ...(response.data.data || []).map(conflict => ({
        type: conflict.type,
        schedule: {
          ...conflict.existingSchedule,
          id: conflict.existingSchedule.id,
          timeSlotId: targetTimeSlot,
          dayOfWeek: targetDay,
          classId: conflict.existingSchedule.classId
        },
        originalTimeSlot: targetTimeSlot,
        originalDay: targetDay
      })),
      ...teacherConflicts
    ]

    if (allConflicts.length > 0) {
      // 添加新的冲突到列表中
      allConflicts.forEach(conflict => {
        const existingConflict = conflictList.value.find(
          c => c.schedule.id === conflict.schedule.id
        )
        if (!existingConflict) {
          conflictList.value.push(conflict)
        }
      })

      // 更新目标课程状态
      targetSchedule.value = sourceSchedule
      hasConflict.value = true

      // 显示冲突提示
      ElMessage.warning(`发现 ${allConflicts.length} 个课程冲突，请处理`)
      return // 有冲突时不执行移动操作
    }

    // 只有在没有冲突时才更新源课程位置
    await updateSchedulePosition(sourceSchedule.id, targetTimeSlot, targetDay)
    ElMessage.success("课程调整成功")

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

// 判断是否为冲突程
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

// 检查课程是否冲突
const checkScheduleStillConflicts = async (schedule) => {
  try {
    // 检查当前位置是否有冲突
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
  // 获取最新的课程数据
  await fetchSchedules()

  // 检查每冲突课程的当前状态
  const newConflictList = []
  for (const conflict of conflictList.value) {
    // 在最新的课程数据中查找这个课程
    const currentSchedule = scheduleData.value.find(s => s.id === conflict.schedule.id)
    if (currentSchedule) {
      const stillConflicts = await checkScheduleStillConflicts(currentSchedule)
      if (stillConflicts) {
        // 更新课程的最新状态
        newConflictList.push({
          ...conflict,
          schedule: {
            ...currentSchedule,
            className: conflict.schedule.className
          }
        })
      }
    }
  }

  // 更新状态
  if (newConflictList.length !== conflictList.value.length) {
    conflictList.value = newConflictList
    if (newConflictList.length === 0) {
      // 清除所有冲突状态
      targetSchedule.value = null
      hasConflict.value = false
    }
  }
}

// 获取冲突类型文本
const getConflictTypeText = (type) => {
  const typeMap = {
    'teacher': '教师时间冲突',
    'class': '班级时间冲突',
    'teacher_other_class': '教师在其他班级有课'
  }
  return typeMap[type] || '未知冲突'
}

// 切换到指定班级
const switchToClass = async (classId) => {
  try {
    // 在班级列表中查找对应的班级
    const targetClass = classes.value.find(cls =>
      (cls.id === classId || cls._id === classId)
    )

    if (!targetClass) {
      console.warn("未找到目标班级:", classId)
      ElMessage.warning("未找到目标班级")
      return
    }

    // 更新选中的班级
    currentClass.value = targetClass.id || targetClass._id

    // 刷新课表数据
    await fetchSchedules()

    ElMessage.success(`已切换到 ${targetClass.name} 的课表`)
  } catch (error) {
    console.error("切换班级失败:", error)
    ElMessage.error("切换班级失败")
  }
}

// 检查教师在其他班级的课程冲突
const checkTeacherOtherClassConflicts = async (teacherId, targetTimeSlot, targetDay, weeks, excludeScheduleId) => {
  if (!teacherId) {
    console.warn("未提供教师ID")
    return []
  }

  try {
    console.log("查询教师课程，教师ID:", teacherId)
    // 获取教师在所有班级的课程
    const response = await getTeacherScheduleFull({
      teacherId: String(teacherId) // 确保 ID 是字符串类型
    })

    if (!response.data?.data) {
      console.warn("未获取到教师课程数据")
      return []
    }

    const teacherSchedules = response.data.data

    // 筛选出在目标时间段有冲突的课程
    const conflicts = teacherSchedules.filter(schedule =>
      schedule._id !== excludeScheduleId && // 排除当前课程
      schedule.timeSlotId === targetTimeSlot &&
      schedule.dayOfWeek === targetDay &&
      schedule.weeks.some(week => weeks.includes(week)) // 检查周次是否有重叠
    )

    return conflicts.map(schedule => ({
      type: 'teacher_other_class',
      schedule: {
        id: schedule._id,
        timeSlotId: schedule.timeSlotId,
        dayOfWeek: schedule.dayOfWeek,
        courseName: schedule.courseId?.name || "未知课程",
        teacherName: schedule.teacherId?.name || "未知教师",
        className: schedule.classId?.name || "未知班级",
        classId: schedule.classId?._id,
        weeks: schedule.weeks || []
      },
      originalTimeSlot: targetTimeSlot,
      originalDay: targetDay
    }))
  } catch (error) {
    console.error("检查教师其他班级冲突失败:", error)
    return []
  }
}

// 提供刷新方法给父组件调用
const refreshSchedules = async () => {
  await fetchSchedules()
}

// 暴露方法给父组件
defineExpose({
  refreshSchedules
})

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

[draggable] {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}
</style>