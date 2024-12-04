<template>
  <div class="p-4">
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索班级名称或院系" class="w-64" clearable :prefix-icon="Search" />
        <el-select v-model="gradeFilter" placeholder="选择年级" clearable class="w-32">
          <el-option v-for="grade in grades" :key="grade" :label="`${grade}级`" :value="grade" />
        </el-select>
        <el-select v-model="departmentFilter" placeholder="选择院系" clearable class="w-48">
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">
        新增班级
      </el-button>
    </div>

    <el-table v-loading="loading" :data="paginatedClasses" border style="width: 100%" row-key="id">
      <el-table-column prop="name" label="班级名称" width="180" />
      <el-table-column prop="department" label="所属院系" width="180" />
      <el-table-column label="年级" width="100">
        <template #default="{ row }">
          {{ row.grade }}级
        </template>
      </el-table-column>
      <el-table-column prop="classNumber" label="班号" width="80" align="center" />
      <el-table-column prop="studentCount" label="学生人数" width="100" align="center" />
      <el-table-column label="课程数" width="100" align="center">
        <template #default="{ row }">
          {{ row.courses?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="{ row }">
          <el-button :icon="Edit" link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button :icon="View" link type="info" @click="handleViewCourses(row)">
            课程
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

    <!-- 班级表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formType === 'add' ? '新增班级' : '编辑班级'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="form.name" placeholder="如：测绘23级1班" />
        </el-form-item>
        <el-form-item label="所属院系" prop="department">
          <el-select v-model="form.department" class="w-full" filterable allow-create default-first-option>
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input-number v-model="form.grade" :min="2020" :max="2030" />
        </el-form-item>
        <el-form-item label="班号" prop="classNumber">
          <el-input-number v-model="form.classNumber" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="学生人数" prop="studentCount">
          <el-input-number v-model="form.studentCount" :min="0" :max="100" />
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

    <!-- 课程列表对话框 -->
    <el-dialog v-model="coursesDialogVisible" :title="selectedClass ? `${selectedClass.name}的课程列表` : '课程列表'"
      width="800px">
      <el-table :data="selectedClassCourses" border stripe>
        <el-table-column prop="code" label="课程代码" width="120" />
        <el-table-column prop="name" label="课程名称" />
        <el-table-column prop="credit" label="学分" width="80" align="center" />
        <el-table-column prop="hours" label="课时" width="80" align="center" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="上课周次" width="120">
          <template #default="{ row }">
            {{ row.weeks?.start }}-{{ row.weeks?.end }}周
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { Search, Plus, Edit, Delete, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  getClassList,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from "@/api/class"

// 列表数据
const classes = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref("")
const gradeFilter = ref("")
const departmentFilter = ref("")

// 计算分页后的数据
const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return classes.value.slice(start, end)
})

// 从班级列表中提取所有院系
const departments = computed(() => {
  if (!Array.isArray(classes.value)) return []
  const deptSet = new Set(
    classes.value
      .map((c) => c.department)
      .filter(Boolean)
  )
  return Array.from(deptSet).sort()
})

// 从班级列表中提取所有年级
const grades = computed(() => {
  if (!Array.isArray(classes.value)) return []
  const gradeSet = new Set(
    classes.value
      .map((c) => c.grade)
      .filter(Boolean)
  )
  return Array.from(gradeSet).sort((a, b) => b - a)
})

// 表单数据
const dialogVisible = ref(false)
const formType = ref("add")
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  name: "",
  department: "",
  grade: new Date().getFullYear(),
  classNumber: 1,
  studentCount: 0,
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入班级名称", trigger: "blur" }],
  department: [{ required: true, message: "请选择所属院系", trigger: "change" }],
  grade: [{ required: true, message: "请输入年级", trigger: "blur" }],
  classNumber: [{ required: true, message: "请输入班号", trigger: "blur" }],
  studentCount: [{ required: true, message: "请输入学生人数", trigger: "blur" }],
}

// 课程列表对话框
const coursesDialogVisible = ref(false)
const selectedClass = ref(null)
const selectedClassCourses = ref([])

// 获取班级列表
const fetchClasses = async () => {
  try {
    loading.value = true
    const params = {
      query: searchQuery.value || undefined,
      grade: gradeFilter.value || undefined,
      department: departmentFilter.value || undefined,
    }
    const { data } = await getClassList(params)
    console.log("班级列表响应:", data)
    if (Array.isArray(data)) {
      classes.value = data
      total.value = data.length
    } else if (data?.items) {
      classes.value = data.items
      total.value = data.total || data.items.length
    } else {
      classes.value = []
      total.value = 0
    }
    console.log("处理后的班级列表:", classes.value)
  } catch (error) {
    console.error("获取班级列表失败:", error)
    ElMessage.error(error.response?.data?.message || "获取班级列表失败")
    classes.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听查询条件变化
watch(
  [searchQuery, gradeFilter, departmentFilter],
  () => {
    currentPage.value = 1
    fetchClasses()
  },
  { immediate: true }
)

// 新增班级
const handleAdd = () => {
  formType.value = "add"
  form.value = {
    name: "",
    department: "",
    grade: new Date().getFullYear(),
    classNumber: 1,
    studentCount: 0,
  }
  dialogVisible.value = true
}

// 编辑班级
const handleEdit = (row) => {
  formType.value = "edit"
  form.value = { ...row }
  dialogVisible.value = true
}

// 查看课程
const handleViewCourses = async (row) => {
  try {
    selectedClass.value = row
    const { data } = await getClassById(row.id)
    selectedClassCourses.value = data.courses || []
    coursesDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "获取班级课程失败")
  }
}

// 删除班级
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      row.courses?.length
        ? "该班级还有关联的课程，确定要删除吗？"
        : "确定要删除该班级吗？",
      "提示",
      {
        type: "warning",
      }
    )
    await deleteClass(row.id)
    ElMessage.success("删除成功")
    fetchClasses()
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
      await createClass(form.value)
    } else {
      await updateClass(form.value.id, form.value)
    }

    ElMessage.success(`${formType.value === "add" ? "创建" : "更新"}成功`)
    dialogVisible.value = false
    fetchClasses()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || `${formType.value === "add" ? "创建" : "更新"}失败`)
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchClasses()
})
</script>