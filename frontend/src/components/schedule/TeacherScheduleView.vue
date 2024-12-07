<template>
  <div>
    <!-- 筛选条件 -->
    <div class="mb-4 flex items-center space-x-4">
      <el-select v-model="selectedTeachers" multiple collapse-tags collapse-tags-tooltip placeholder="选择教师" clearable
        style="width: 400px" @change="val => console.log('选中的教师:', val)">
        <el-option v-for="teacher in teachers" :key="teacher.id || teacher._id" :label="teacher.name"
          :value="teacher.id || teacher._id" />
      </el-select>
      <el-button type="primary" @click="handleSelectAllTeachers">
        {{ selectedTeachers.length === teachers.length ? '取消全选' : '全选' }}
      </el-button>
    </div>

    <!-- 课表 -->
    <el-table :data="scheduleTableData" border>
      <el-table-column prop="time" label="时间" width="150" />
      <el-table-column v-for="day in ['周一', '周二', '周三', '周四', '周五']" :key="day" :label="day">
        <template #default="{ row }">
          <div v-if="row[day]?.length" class="space-y-2">
            <div v-for="(schedule, index) in row[day]" :key="index" class="p-2 rounded" :class="getCellClass(schedule)">
              <p class="font-medium">{{ schedule.courseName }}</p>
              <p class="text-sm">{{ schedule.className }}</p>
              <p class="text-xs text-gray-600">{{ schedule.teacherName }}</p>
              <p class="text-xs text-gray-500">({{ formatWeeks(schedule.weeks) }})</p>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { getAllTeachers } from "@/api/teacher"
import { getTeacherScheduleFull } from "@/api/schedule"
import { getCellClass, convertToTableData, formatWeeks, mergeScheduleWeeks } from "@/utils/schedule"

const props = defineProps({
  currentTemplate: {
    type: Object,
    required: true
  }
})

const selectedTeachers = ref([])
const teachers = ref([])
const scheduleData = ref([])
const loading = ref(false)

// 转换课表数据为表格格式
const scheduleTableData = computed(() => {
  const mergedSchedules = mergeScheduleWeeks(scheduleData.value)
  return convertToTableDataMultiple(props.currentTemplate, mergedSchedules)
})

// 转换多教师数据为表格格式
const convertToTableDataMultiple = (template, scheduleData = []) => {
  if (!template?.periods) return []

  const timeSlots = [
    ...(template.periods.morning || []),
    ...(template.periods.afternoon || []),
    ...(template.periods.evening || [])
  ].map((slot, index) => ({
    ...slot,
    id: slot.id || slot._id || `time-${index + 1}`,
    startTime: slot.startTime || slot.time?.split("-")[0] || "",
    endTime: slot.endTime || slot.time?.split("-")[1]?.split("\\n")[0] || "",
    name: slot.name || slot.time?.split("\\n")[1] || `第${index + 1}节`
  }))

  return timeSlots.map(slot => {
    const row = {
      time: `${slot.startTime}-${slot.endTime}\n${slot.name}`,
      timeSlotId: slot.id
    }

      // 添加每天的课程
      ;['周一', '周二', '周三', '周四', '周五'].forEach((day, index) => {
        // 查找当前时间槽的所有课程
        const schedules = scheduleData.filter(s =>
          String(s.timeSlotId) === String(slot.id) &&
          s.dayOfWeek === index + 1
        )

        row[day] = schedules.length ? schedules : null
      })

    return row
  })
}

// 获取教师列表
const fetchTeachers = async () => {
  try {
    const { data } = await getAllTeachers()
    console.log("教师数据:", data)
    teachers.value = data.filter(teacher => teacher.status === "active").map(teacher => ({
      ...teacher,
      id: teacher.id || teacher._id
    }))

    if (teachers.value.length > 0) {
      console.log("第一个教师:", teachers.value[0])
      selectedTeachers.value = [teachers.value[0].id || teachers.value[0]._id]
    }
  } catch (error) {
    console.error("获取教师列表失败:", error)
    ElMessage.error("获取教师列表失败")
  }
}

// 获取课表数据
const fetchSchedules = async () => {
  if (!selectedTeachers.value.length) {
    scheduleData.value = []
    return
  }

  try {
    loading.value = true
    // 获取所有选中教师的课表
    const promises = selectedTeachers.value.map(teacherId =>
      getTeacherScheduleFull({ teacherId })
    )
    const responses = await Promise.all(promises)

    // 合并所有教师的课表数据
    const allSchedules = responses.flatMap((response, index) => {
      const teacherId = selectedTeachers.value[index]
      const teacher = teachers.value.find(t => (t.id || t._id) === teacherId)
      return response.data.data.map(schedule => ({
        timeSlotId: schedule.timeSlotId,
        dayOfWeek: schedule.dayOfWeek,
        courseName: schedule.courseId?.name || "未知课程",
        className: schedule.classId?.name || "未知班级",
        teacherName: teacher?.name || "未知教师",
        status: schedule.status || "draft",
        weeks: schedule.weeks || []
      }))
    })

    scheduleData.value = allSchedules
    console.log("转换后的数据:", scheduleData.value)
  } catch (error) {
    console.error("获取课表失败:", error)
    ElMessage.error("获取课表失败")
    scheduleData.value = []
  } finally {
    loading.value = false
  }
}

// 全选/取消全选
const handleSelectAllTeachers = () => {
  if (selectedTeachers.value.length === teachers.value.length) {
    selectedTeachers.value = []
  } else {
    selectedTeachers.value = teachers.value.map(t => t.id || t._id)
  }
}

// 监听数据变化
watch(selectedTeachers, () => {
  fetchSchedules()
})

// 页面加载时初始化数据
onMounted(() => {
  fetchTeachers()
})
</script>

<style scoped>
.el-table :deep(td) {
  height: 100px;
}
</style>