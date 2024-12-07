<template>
  <div>
    <!-- 筛选条件 -->
    <div class="mb-4 flex space-x-4">
      <el-select v-model="currentClass" placeholder="选择班级" @change="val => console.log('选中的班级:', val)">
        <el-option v-for="cls in classes" :key="cls.id || cls._id" :label="cls.name" :value="cls.id || cls._id" />
      </el-select>
    </div>

    <!-- 课表 -->
    <el-table :data="scheduleTableData" border>
      <el-table-column prop="time" label="时间" width="150" />
      <el-table-column v-for="day in ['周一', '周二', '周三', '周四', '周五']" :key="day" :label="day">
        <template #default="{ row }">
          <template v-if="Array.isArray(row[day])">
            <div v-for="schedule in row[day]" :key="schedule.id" class="p-2 rounded" :class="getCellClass(schedule)">
              <p class="font-medium">{{ schedule.courseName }}</p>
              <p class="text-sm">{{ schedule.teacherName }}</p>
              <p class="text-xs text-gray-500">({{ formatWeeks(schedule.weeks) }})</p>
            </div>
          </template>
        </template>
      </el-table-column>
    </el-table>


  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { getClassList } from "@/api/class"
import { getClassScheduleFull } from "@/api/schedule"
import { getCellClass, convertToTableData, formatWeeks, mergeScheduleWeeks } from "@/utils/schedule"

const props = defineProps({
  currentTemplate: {
    type: Object,
    required: true
  }
})

const currentClass = ref("")
const classes = ref([])
const scheduleData = ref([])
const loading = ref(false)

// 转换课表数据为表格格式
const scheduleTableData = computed(() => {
  const mergedSchedules = mergeScheduleWeeks(scheduleData.value)
  return convertToTableData(props.currentTemplate, mergedSchedules)
})

// 获取班级列表
const fetchClasses = async () => {
  try {
    const { data } = await getClassList()
    // 打印一下数据结构
    console.log("班级数据:", data)
    classes.value = data.filter(cls => cls.status === "active").map(cls => ({
      ...cls,
      id: cls.id || cls._id // 确保有 id 字段
    }))
    if (classes.value.length > 0) {
      console.log("第一个班级:", classes.value[0])
      currentClass.value = classes.value[0].id || classes.value[0]._id
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

// 监听班级变化
watch(currentClass, () => {
  if (currentClass.value) {
    fetchSchedules()
  }
})

// 页面加载时初始化数据
onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.el-table :deep(td) {
  height: 100px;
}
</style>