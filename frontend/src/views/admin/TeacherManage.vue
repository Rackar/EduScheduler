<template>
  <div class="p-4">
    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索教师姓名、用户名或邮箱" class="w-64" clearable :prefix-icon="Search" />
        <el-select v-model="departmentFilter" placeholder="选择院系" clearable class="w-48">
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">
        新增教师
      </el-button>
    </div>

    <!-- 教师列表 -->
    <el-table v-loading="loading" :data="teachers" border style="width: 100%" row-key="_id">
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="profile.title" label="职称" width="120" />
      <el-table-column prop="profile.department" label="所属院系" width="150" />
      <el-table-column label="课程数" width="100" align="center">
        <template #default="{ row }">
          {{ row.profile?.courses?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button :icon="Edit" link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button :icon="Timer" link type="warning" @click="handleAvailability(row)">
            时间
          </el-button>
          <el-button :icon="Delete" link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 教师表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formType === 'add' ? '新增教师' : '编辑教师'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="formType === 'edit'" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" class="w-full">
            <el-option label="教授" value="教授" />
            <el-option label="副教授" value="副教授" />
            <el-option label="讲师" value="讲师" />
            <el-option label="助教" value="助教" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属院系" prop="department">
          <el-select v-model="form.department" class="w-full" filterable allow-create default-first-option>
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
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

    <!-- 时间设置对话框 -->
    <el-dialog v-model="availabilityDialogVisible" title="设置教师可用时间" width="800px" destroy-on-close>
      <div class="grid grid-cols-6 gap-4">
        <div class="col-span-1"></div>
        <div v-for="day in weekDays" :key="day.value" class="col-span-1 text-center font-bold">
          {{ day.label }}
        </div>
        <template v-for="slot in timeSlots" :key="slot.value">
          <div class="text-right">{{ slot.label }}</div>
          <div v-for="day in weekDays" :key="day.value" class="flex justify-center items-center">
            <el-checkbox v-model="availabilityForm[`${day.value}_${slot.value}`]" border />
          </div>
        </template>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="availabilityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAvailabilitySubmit" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { Search, Plus, Edit, Delete, Timer } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useUserStore } from "@/stores/user"
import {
  getTeacherList,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherAvailability,
  updateTeacherAvailability,
} from "@/api"

// 用户信息
const userStore = useUserStore()

// 列表数据
const teachers = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref("")
const departmentFilter = ref("")

// 从教师列表中提取所有院系
const departments = computed(() => {
  const deptSet = new Set(
    teachers.value
      .map((t) => t.profile?.department)
      .filter((d) => d)
  )
  return Array.from(deptSet).sort()
})

// 表单数据
const dialogVisible = ref(false)
const formType = ref("add")
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  username: "",
  name: "",
  email: "",
  phone: "",
  title: "",
  department: "",
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名至少3个字符", trigger: "blur" },
  ],
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [{ required: true, message: "请输入电话", trigger: "blur" }],
  title: [{ required: true, message: "请选择职称", trigger: "change" }],
  department: [{ required: true, message: "请选择院系", trigger: "change" }],
}

// 时间设置数据
const availabilityDialogVisible = ref(false)
const currentTeacherId = ref(null)
const availabilityForm = ref({})
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

// 获取教师列表
const fetchTeachers = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      department: departmentFilter.value,
    }
    const { items, total: totalCount } = await getTeacherList(params)
    teachers.value = items
    total.value = totalCount
  } catch (error) {
    ElMessage.error(error.message || "获取教师列表失败")
  } finally {
    loading.value = false
  }
}

// 监听查询条件变化
watch(
  [currentPage, pageSize, searchQuery, departmentFilter],
  () => {
    fetchTeachers()
  }
)

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 新增教师
const handleAdd = () => {
  formType.value = "add"
  form.value = {
    username: "",
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "",
  }
  dialogVisible.value = true
}

// 编辑教师
const handleEdit = (row) => {
  formType.value = "edit"
  form.value = {
    _id: row._id,
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    title: row.profile?.title,
    department: row.profile?.department,
  }
  dialogVisible.value = true
}

// 删除教师
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      "删除教师将同时删除其账号，是否确认？",
      "提示",
      {
        type: "warning",
      }
    )
    await deleteTeacher(row._id)
    ElMessage.success("删除成功")
    fetchTeachers()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败")
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      username: form.value.username,
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      title: form.value.title,
      department: form.value.department,
    }

    if (formType.value === "add") {
      await createTeacher(data)
      ElMessage.success("创建成功")
    } else {
      await updateTeacher(form.value._id, data)
      ElMessage.success("更新成功")
    }

    dialogVisible.value = false
    fetchTeachers()
  } catch (error) {
    ElMessage.error(error.message || `${formType.value === "add" ? "创建" : "更新"}失败`)
  } finally {
    submitting.value = false
  }
}

// 设置时间
const handleAvailability = async (row) => {
  currentTeacherId.value = row._id
  try {
    const availability = await getTeacherAvailability(row._id)
    availabilityForm.value = availability
    availabilityDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || "获取时间设置失败")
  }
}

// 提交时间设置
const handleAvailabilitySubmit = async () => {
  if (!currentTeacherId.value) return

  try {
    submitting.value = true
    await updateTeacherAvailability(
      currentTeacherId.value,
      availabilityForm.value
    )
    ElMessage.success("更新成功")
    availabilityDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.message || "更新失败")
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchTeachers()
})
</script>