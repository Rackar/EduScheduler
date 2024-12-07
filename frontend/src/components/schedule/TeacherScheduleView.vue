<template>
  <div>
    <!-- 筛选条件 -->
    <div class="mb-4 flex space-x-4">
      <el-select v-model="currentTeacher" placeholder="选择教师">
        <el-option v-for="teacher in teachers" :key="teacher._id" :label="teacher.name" :value="teacher._id" />
      </el-select>
    </div>

    <!-- 课表 -->
    <el-table :data="scheduleTableData" border>
      <el-table-column prop="time" label="时间" width="150" />
      <el-table-column v-for="day in ['周一', '周二', '周三', '周四', '周五']" :key="day" :label="day">
        <template #default="{ row }">
          <div v-if="row[day]" class="p-2 rounded" :class="getCellClass(row[day])">
            <p class="font-medium">{{ row[day].courseName }}</p>
            <p class="text-sm">{{ row[day].className }}</p>
            <p class="text-xs text-gray-500">({{ formatWeeks(row[day].weeks) }})</p>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { getTeacherList } from "@/api/teacher"
import { getTeacherScheduleFull } from "@/api/schedule"
import { getCellClass, convertToTableData, formatWeeks, mergeScheduleWeeks } from "@/utils/schedule"

const props = defineProps({
  currentTemplate: {
    type: Object,
    required: true
  }
})

const currentTeacher = ref("")
const teachers = ref([])
const scheduleData = ref([])
const loading = ref(false)

// 转换课表数据为表格格式
const scheduleTableData = computed(() => {
  const mergedSchedules = mergeScheduleWeeks(scheduleData.value)
  return convertToTableData(props.currentTemplate, mergedSchedules)
})

// 获取教师列表
const fetchTeachers = async () => {
  try {
    const { data } = await getTeacherList()
    teachers.value = data.filter(teacher => teacher.status === "active")
    if (teachers.value.length > 0) {
      currentTeacher.value = teachers.value[0]._id
    }
  } catch (error) {
    console.error("获取教师列表失败:", error)
    ElMessage.error("获取教师列表失败")
  }
}

// 获取课表数据
const fetchSchedules = async () => {
  if (!currentTeacher.value) return

  try {
    loading.value = true
    const { data } = await getTeacherScheduleFull({
      teacherId: currentTeacher.value
    })

    // 转换数据格式
    scheduleData.value = data.map(schedule => ({
      timeSlotId: schedule.timeSlotId,
      dayOfWeek: schedule.dayOfWeek,
      courseName: schedule.courseId?.name || "未知课程",
      className: schedule.classId?.name || "未知班级",
      status: schedule.status || "draft",
      weeks: schedule.weeks
    }))
  } catch (error) {
    console.error("获取课表失败:", error)
    ElMessage.error("获取课表失败")
    scheduleData.value = [] // 出错时设置为空数组
  } finally {
    loading.value = false
  }
}

// 监听教师变化
watch(currentTeacher, () => {
  if (currentTeacher.value) {
    fetchSchedules()
  }
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