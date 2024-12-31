<template>
  <div class="p-4">
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索教师姓名或用户名" class="w-64" clearable :prefix-icon="Search" />
        <el-select v-model="departmentFilter" placeholder="选择院系" clearable class="w-48">
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
        <el-select v-model="titleFilter" placeholder="选择职称" clearable class="w-32">
          <el-option v-for="title in titles" :key="title" :label="title" :value="title" />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">
        新增教师
      </el-button>
    </div>

    <el-table v-loading="loading" :data="teachers" border style="width: 100%" row-key="id">
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="department" label="所属院系" width="150" />
      <el-table-column prop="title" label="职称" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === "active" ? "在职" : "离职" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="{ row }">
          <el-button :icon="Edit" link type="primary" @click="handleEdit(row)">
            编辑
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
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所属院系" prop="department">
          <el-select v-model="form.department" class="w-full" filterable allow-create default-first-option>
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" class="w-full" filterable allow-create default-first-option>
            <el-option v-for="title in titles" :key="title" :label="title" :value="title" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
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
const titleFilter = ref("")

// 从教师列表中提取所有院系
const departments = computed(() => {
  if (!teachers.value) return []
  const deptSet = new Set(
    teachers.value
      .map((t) => t.department)
      .filter(Boolean)
  )
  return Array.from(deptSet).sort()
})

// 从教师列表中提取所有职称
const titles = computed(() => {
  if (!teachers.value) return []
  const titleSet = new Set(
    teachers.value
      .map((t) => t.title)
      .filter(Boolean)
  )
  return Array.from(titleSet).sort()
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
  department: "",
  title: "",
  status: "active",
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
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" },
  ],
  department: [{ required: false, message: "请选择所属院系", trigger: "change" }],
  title: [{ required: false, message: "请选择职称", trigger: "change" }],
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
      title: titleFilter.value,
    }
    const { data } = await getTeacherList(params)
    teachers.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "获取教师列表失败")
  } finally {
    loading.value = false
  }
}

// 监听查询条件变化
watch(
  [currentPage, pageSize, searchQuery, departmentFilter, titleFilter],
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
    department: "",
    title: "",
    status: "active",
  }
  dialogVisible.value = true
}

// 编辑教师
const handleEdit = (row) => {
  formType.value = "edit"
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除教师
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该教师吗？", "提示", {
      type: "warning",
    })
    await deleteTeacher(row.id)
    ElMessage.success("删除成功")
    fetchTeachers()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.response?.data?.message || "删除失败")
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (formType.value === "add") {
      await createTeacher(form.value)
    } else {
      await updateTeacher(form.value.id, form.value)
    }

    ElMessage.success(`${formType.value === "add" ? "创建" : "更新"}成功`)
    dialogVisible.value = false
    fetchTeachers()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || `${formType.value === "add" ? "创建" : "更新"}失败`)
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