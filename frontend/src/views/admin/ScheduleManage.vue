<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- 操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <el-select v-model="currentClass" placeholder="选择班级" class="w-40" @change="loadSchedule">
          <el-option v-for="classItem in classOptions" :key="classItem._id" :label="classItem.name"
            :value="classItem._id" />
        </el-select>
        <el-select v-model="currentWeek" placeholder="选择周次" class="w-32" @change="loadSchedule">
          <el-option v-for="week in 20" :key="week" :label="`第${week}周`" :value="week" />
        </el-select>
        <el-radio-group v-model="viewType" size="small" @change="loadSchedule">
          <el-radio-button label="week">周视图</el-radio-button>
          <el-radio-button label="list">列表视图</el-radio-button>
        </el-radio-group>
      </div>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleAutoSchedule">
          <el-icon>
            <Plus />
          </el-icon>自动排课
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon>
            <Download />
          </el-icon>导出课表
        </el-button>
      </div>
    </div>

    <!-- 周视图课程表 -->
    <template v-if="viewType === 'week'">
      <div class="border rounded">
        <!-- 表头 -->
        <div class="grid grid-cols-6 bg-gray-50">
          <div class="p-2 text-center border-r font-bold">时间</div>
          <div v-for="day in weekDays" :key="day.value" class="p-2 text-center border-r font-bold">
            {{ day.label }}
          </div>
        </div>

        <!-- 课程格子 -->
        <div v-loading="loading">
          <div v-for="timeSlot in timeSlots" :key="timeSlot.value" class="grid grid-cols-6 border-t">
            <div class="p-2 text-center border-r bg-gray-50">
              {{ timeSlot.label }}
            </div>
            <div v-for="day in weekDays" :key="day.value" class="p-2 border-r min-h-[100px] relative"
              @click="handleAddCourse(day.value, timeSlot.value)">
              <template v-if="getScheduleItem(day.value, timeSlot.value)">
                <div class="absolute inset-1 rounded bg-blue-100 p-2 cursor-pointer hover:shadow-lg transition-shadow"
                  @click.stop="handleEditCourse(getScheduleItem(day.value, timeSlot.value))">
                  <div class="text-sm font-bold">{{ getScheduleItem(day.value, timeSlot.value).course.name }}</div>
                  <div class="text-xs text-gray-600">{{ getScheduleItem(day.value, timeSlot.value).teacher.username }}
                  </div>
                  <div class="text-xs text-gray-600">{{ getClassroomInfo(getScheduleItem(day.value, timeSlot.value)) }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 列表视图 -->
    <template v-else>
      <el-table :data="scheduleList" v-loading="loading" border stripe>
        <el-table-column prop="week" label="周次" width="80">
          <template #default="{ row }">
            第{{ row.week }}周
          </template>
        </el-table-column>
        <el-table-column prop="day" label="星期" width="100">
          <template #default="{ row }">
            {{ getDayLabel(row.day) }}
          </template>
        </el-table-column>
        <el-table-column prop="timeSlot" label="时间段" width="100">
          <template #default="{ row }">
            {{ getTimeSlotLabel(row.timeSlot) }}
          </template>
        </el-table-column>
        <el-table-column prop="course.name" label="课程" />
        <el-table-column prop="teacher.username" label="教师" width="100" />
        <el-table-column prop="class.name" label="班级" width="120" />
        <el-table-column label="教室" width="150">
          <template #default="{ row }">
            {{ getClassroomInfo(row) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" @click="handleEditCourse(row)" link>
                <el-icon>
                  <Edit />
                </el-icon>编辑
              </el-button>
              <el-button type="danger" @click="handleDeleteCourse(row)" link>
                <el-icon>
                  <Delete />
                </el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 课程表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formType === 'add' ? '添加课程' : '编辑课程'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="周次" prop="week" v-if="formType === 'add'">
          <el-input-number v-model="form.week" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="星期" prop="day" v-if="formType === 'add'">
          <el-select v-model="form.day" class="w-full">
            <el-option v-for="day in weekDays" :key="day.value" :label="day.label" :value="day.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间段" prop="timeSlot" v-if="formType === 'add'">
          <el-select v-model="form.timeSlot" class="w-full">
            <el-option v-for="slot in timeSlots" :key="slot.value" :label="slot.label" :value="slot.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="form.courseId" class="w-full" filterable remote :remote-method="searchCourses"
            :loading="courseLoading">
            <el-option v-for="item in courseOptions" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="教师" prop="teacherId">
          <el-select v-model="form.teacherId" class="w-full" filterable remote :remote-method="searchTeachers"
            :loading="teacherLoading">
            <el-option v-for="item in teacherOptions" :key="item._id" :label="item.username" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级" prop="classId">
          <el-select v-model="form.classId" class="w-full">
            <el-option v-for="item in classOptions" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="教室" prop="classroomId">
          <el-select v-model="form.classroomId" class="w-full" filterable remote :remote-method="searchClassrooms"
            :loading="classroomLoading">
            <el-option v-for="item in classroomOptions" :key="item._id" :label="`${item.building}-${item.room}`"
              :value="item._id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 自动排课对话框 -->
    <el-dialog v-model="autoScheduleDialogVisible" title="自动排课" width="500px">
      <el-form ref="autoScheduleFormRef" :model="autoScheduleForm" label-width="100px">
        <el-form-item label="起始周">
          <el-input-number v-model="autoScheduleForm.startWeek" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="结束周">
          <el-input-number v-model="autoScheduleForm.endWeek" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="autoScheduleForm.priority">
            <el-radio label="teacher">教师优先</el-radio>
            <el-radio label="classroom">教室优先</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="教室分配">
          <el-switch v-model="autoScheduleForm.considerClassroom" active-text="需要分配教室" inactive-text="使用固定教室" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="autoScheduleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAutoScheduleSubmit" :loading="autoScheduleLoading">
            开始排课
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { Download, Edit, Delete, Plus } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  getSchedule,
  generateSchedule,
  adjustSchedule,
  exportSchedule,
  checkConflicts,
  getTimeSlots,
  getClassrooms,
} from "@/api/schedule"
import { getCourseList } from "@/api/course"
import { getTeacherList } from "@/api/teacher"
import { getClassList } from "@/api/class"

// 基础数据
const weekDays = [
  { label: "周一", value: "monday" },
  { label: "周二", value: "tuesday" },
  { label: "周三", value: "wednesday" },
  { label: "周四", value: "thursday" },
  { label: "周五", value: "friday" },
]

const timeSlots = [
  { label: "第1-2节", value: "1-2" },
  { label: "第3-4节", value: "3-4" },
  { label: "第5-6节", value: "5-6" },
  { label: "第7-8节", value: "7-8" },
  { label: "第9-10节", value: "9-10" },
]

// 响应式数据
const scheduleData = ref([])
const loading = ref(false)
const currentClass = ref("")
const currentWeek = ref(1)
const viewType = ref("week")

// 计算属性
const scheduleList = computed(() => {
  if (!Array.isArray(scheduleData.value)) {
    return []
  }

  let filtered = scheduleData.value

  // 按班级筛选
  if (currentClass.value) {
    filtered = filtered.filter(item => item.class?.id === currentClass.value)
  }

  // 按周次筛选
  if (viewType.value === "week") {
    filtered = filtered.filter(item => Number(item.week) === Number(currentWeek.value))
  }

  return filtered
})

// 加载课程表数据
const loadSchedule = async () => {
  try {
    loading.value = true
    const params = {
      classId: currentClass.value || undefined,
      week: viewType.value === "week" ? currentWeek.value : undefined,
    }
    const { data } = await getSchedule(params)
    scheduleData.value = Array.isArray(data) ? data : (data?.items || [])
    console.log("课程表数据:", scheduleData.value) // 添加日志
  } catch (error) {
    console.error("加载课程表失败:", error)
    ElMessage.error(error.response?.data?.message || "获取课程表失败")
    scheduleData.value = []
  } finally {
    loading.value = false
  }
}

// 班级选项
const classOptions = ref([])
const loadClasses = async () => {
  try {
    const { data } = await getClassList()
    classOptions.value = Array.isArray(data) ? data : (data?.items || [])
    console.log("班级列表:", classOptions.value) // 添加日志
  } catch (error) {
    console.error("加载班级列表失败:", error)
    ElMessage.error(error.response?.data?.message || "获取班级列表失败")
    classOptions.value = []
  }
}

// 表单数据
const dialogVisible = ref(false)
const formType = ref('add')
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  week: 1,
  day: 'monday',
  timeSlot: '1-2',
  courseId: '',
  teacherId: '',
  classId: '',
  classroomId: ''
})

// 表单验证规则
const rules = {
  week: [{ required: true, message: '请选择周次', trigger: 'change' }],
  day: [{ required: true, message: '请选择星期', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择时间段', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择教师', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  classroomId: [{ required: true, message: '请选择教室', trigger: 'change' }]
}

// 选项数据
const courseOptions = ref([])
const teacherOptions = ref([])
const classroomOptions = ref([])
const courseLoading = ref(false)
const teacherLoading = ref(false)
const classroomLoading = ref(false)

// 自动排课
const autoScheduleDialogVisible = ref(false)
const autoScheduleLoading = ref(false)
const autoScheduleForm = ref({
  startWeek: 1,
  endWeek: 16,
  priority: 'teacher',
  considerClassroom: true
})

// 搜索课程
const searchCourses = async (query) => {
  if (query !== '') {
    courseLoading.value = true
    try {
      const res = await getCourseList({ query })
      courseOptions.value = res.items
    } catch (error) {
      ElMessage.error('搜索课程失败')
    } finally {
      courseLoading.value = false
    }
  }
}

// 搜索教师
const searchTeachers = async (query) => {
  if (query !== '') {
    teacherLoading.value = true
    try {
      const res = await getTeacherList({ query })
      teacherOptions.value = res.items
    } catch (error) {
      ElMessage.error('搜索教师失败')
    } finally {
      teacherLoading.value = false
    }
  }
}

// 搜索教室
const searchClassrooms = async (query) => {
  if (query !== '') {
    classroomLoading.value = true
    try {
      const res = await getClassrooms({ query })
      classroomOptions.value = res.items
    } catch (error) {
      ElMessage.error('搜索教室失败')
    } finally {
      classroomLoading.value = false
    }
  }
}

// 辅助函数
const getDayLabel = (day) => {
  const found = weekDays.find(d => d.value === day)
  return found ? found.label : day
}

const getTimeSlotLabel = (timeSlot) => {
  const found = timeSlots.find(t => t.value === timeSlot)
  return found ? found.label : timeSlot
}

const getScheduleItem = (day, timeSlot) => {
  return scheduleList.value.find(
    item => item.day === day && item.timeSlot === timeSlot
  )
}

const getClassroomInfo = (schedule) => {
  if (!schedule?.classroom) return "未分配教室"
  return `${schedule.classroom.building}-${schedule.classroom.room}`
}

// 添加课程
const handleAddCourse = (day, timeSlot) => {
  formType.value = 'add'
  form.value = {
    week: currentWeek.value,
    day,
    timeSlot,
    courseId: '',
    teacherId: '',
    classId: currentClass.value,
    classroomId: ''
  }
  dialogVisible.value = true
}

// 编辑课程
const handleEditCourse = (row) => {
  formType.value = 'edit'
  form.value = {
    ...row,
    courseId: row.course._id,
    teacherId: row.teacher._id,
    classId: row.class?._id,
    classroomId: row.classroom?._id
  }
  dialogVisible.value = true
}

// 删除课程
const handleDeleteCourse = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程安排吗？', '提示', {
      type: 'warning'
    })
    await adjustSchedule({
      id: row._id,
      action: 'delete'
    })
    ElMessage.success('删除成功')
    loadSchedule()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 检查时间冲突
        const conflicts = await checkConflicts({
          ...form.value,
          id: formType.value === 'edit' ? form.value._id : undefined
        })
        if (conflicts.length > 0) {
          ElMessage.warning('存在时间冲突，请重新选择时间')
          return
        }

        await adjustSchedule({
          ...form.value,
          action: formType.value === 'add' ? 'add' : 'update'
        })
        ElMessage.success(formType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        loadSchedule()
      } catch (error) {
        ElMessage.error(formType.value === 'add' ? '添加失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 自动排课
const handleAutoSchedule = () => {
  autoScheduleDialogVisible.value = true
}

// 提交自动排课
const handleAutoScheduleSubmit = async () => {
  autoScheduleLoading.value = true
  try {
    await generateSchedule(autoScheduleForm.value)
    ElMessage.success('自动排课成功')
    autoScheduleDialogVisible.value = false
    loadSchedule()
  } catch (error) {
    ElMessage.error('自动排课失败')
  } finally {
    autoScheduleLoading.value = false
  }
}

// 导出课表
const handleExport = async () => {
  try {
    const params = {
      week: viewType.value === 'week' ? currentWeek.value : undefined,
      class: currentClass.value || undefined
    }
    const res = await exportSchedule(params)
    // 处理文件下载
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `课程表_${new Date().getTime()}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 监听筛选条件变化
watch(
  [currentClass, currentWeek, viewType],
  () => {
    loadSchedule()
  },
  { immediate: true }
)

// 初始化
onMounted(() => {
  loadClasses()
})
</script>