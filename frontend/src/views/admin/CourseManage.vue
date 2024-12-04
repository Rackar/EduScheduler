<template>
  <div class="p-4">
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索课程名称、代码或院系" class="w-64" clearable :prefix-icon="Search" />
        <el-switch v-model="showInactive" active-text="显示历史版本" inactive-text="仅显示当前版本" />
      </div>
      <div class="flex items-center space-x-2">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增课程
        </el-button>
        <el-dropdown>
          <el-button :icon="Upload">导入课程</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="downloadTemplate">
                <el-icon>
                  <Download />
                </el-icon>下载导入模板
              </el-dropdown-item>
              <el-dropdown-item>
                <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange"
                  accept=".xlsx,.xls">
                  <div class="flex items-center">
                    <el-icon>
                      <Upload />
                    </el-icon>
                    <span>选择文件导入</span>
                  </div>
                </el-upload>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-table v-loading="loading" :data="courses" border style="width: 100%" row-key="_id">
      <el-table-column prop="code" label="课程代码" width="120" />
      <el-table-column prop="name" label="课程名称" width="180" />
      <el-table-column prop="credit" label="学分" width="80" align="center" />
      <el-table-column prop="hours" label="课时" width="80" align="center" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="department" label="开课院系" width="150" />
      <el-table-column label="上课周次" width="120">
        <template #default="{ row }">
          {{ row.weeks?.start }}-{{ row.weeks?.end }}周
        </template>
      </el-table-column>
      <el-table-column prop="teacherName" label="任课教师" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === "active" ? "当前版本" : "历史版本" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="{ row }">
          <el-button v-if="row.status === 'active'" :icon="Edit" link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button v-if="row.status === 'active'" :icon="Delete" link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
          <el-tooltip v-if="row.previousVersion" content="查看历史版本" placement="top">
            <el-button :icon="InfoFilled" link type="info" />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <el-dialog v-model="dialogVisible" :title="formType === 'add' ? '新增课程' : '编辑课程'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="课程代码" prop="code">
          <el-input v-model="form.code" :disabled="formType === 'edit'" />
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input-number v-model="form.credit" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="课时" prop="hours">
          <el-input-number v-model="form.hours" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="课程类型" prop="type">
          <el-select v-model="form.type" class="w-full">
            <el-option label="必修课" value="必修课" />
            <el-option label="选修课" value="选修课" />
            <el-option label="实验课" value="实验课" />
          </el-select>
        </el-form-item>
        <el-form-item label="开课院系" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="上课周次">
          <div class="flex items-center space-x-2">
            <el-form-item prop="weeks.start" class="mb-0">
              <el-input-number v-model="form.weeks.start" :min="1" :max="20" />
            </el-form-item>
            <span>-</span>
            <el-form-item prop="weeks.end" class="mb-0">
              <el-input-number v-model="form.weeks.end" :min="1" :max="20" />
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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

    <el-dialog v-model="importResultVisible" title="导入结果" width="800px" destroy-on-close>
      <div class="mb-4">
        <el-alert :title="`成功导入 ${importResult.successCount} 条数据，失败 ${importResult.failedCount} 条`"
          :type="importResult.failedCount > 0 ? 'warning' : 'success'" show-icon />
      </div>

      <div v-if="importResult.results?.success?.length" class="mb-4">
        <h3 class="text-lg font-bold mb-2">成功导入的课程</h3>
        <el-table :data="importResult.results.success" border stripe>
          <el-table-column prop="code" label="课程代码" width="120" />
          <el-table-column prop="name" label="课程名称" />
          <el-table-column prop="teacher" label="教师" width="120" />
          <el-table-column prop="isUpdate" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isUpdate ? 'warning' : 'success'">
                {{ row.isUpdate ? "更新" : "新增" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="importResult.results?.errors?.length">
        <h3 class="text-lg font-bold mb-2">导入失败的课程</h3>
        <el-table :data="importResult.results.errors" border stripe>
          <el-table-column prop="code" label="课程代码" width="120" />
          <el-table-column prop="name" label="课程名称" />
          <el-table-column prop="error" label="失败原因" show-overflow-tooltip />
        </el-table>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <el-button @click="importResultVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleRetryImport" v-if="importResult.results?.errors?.length">
            重试失败项
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { Search, Plus, Edit, Delete, Upload, Download, InfoFilled } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import * as XLSX from "xlsx"
import { useUserStore } from "@/stores/user"
import {
  getCourseList,
  createCourse,
  updateCourse,
  deleteCourse,
  batchImportCourses
} from "@/api"

// 用户信息
const userStore = useUserStore()

// 列表数据
const courses = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref("")
const showInactive = ref(false)

// 文件上传相关
const fileInputRef = ref(null)
const importResultVisible = ref(false)
const importResult = ref({
  successCount: 0,
  failedCount: 0,
  results: {
    success: [],
    errors: [],
  },
})

// 表单数据
const dialogVisible = ref(false)
const formType = ref("add")
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  name: "",
  code: "",
  credit: 2,
  hours: 32,
  type: "必修课",
  department: "",
  description: "",
  weeks: {
    start: 1,
    end: 20
  }
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入课程名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入课程代码", trigger: "blur" }],
  credit: [{ required: true, message: "请输入学分", trigger: "blur" }],
  hours: [{ required: true, message: "请输入课时", trigger: "blur" }],
  type: [{ required: true, message: "请选择课程类型", trigger: "change" }],
  department: [{ required: true, message: "请输入开课院系", trigger: "blur" }],
  "weeks.start": [{ required: true, message: "请输入开始周次", trigger: "blur" }],
  "weeks.end": [{ required: true, message: "请输入结束周次", trigger: "blur" }]
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      includeInactive: showInactive.value
    }
    const { items, total: totalCount } = await getCourseList(params)
    courses.value = items
    total.value = totalCount
  } catch (error) {
    ElMessage.error(error.message || "获取课程列表失败")
  } finally {
    loading.value = false
  }
}

// 监听查询条件变化
watch([currentPage, pageSize, searchQuery, showInactive], () => {
  fetchCourses()
})

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 新增课程
const handleAdd = () => {
  formType.value = "add"
  form.value = {
    name: "",
    code: "",
    credit: 2,
    hours: 32,
    type: "必修课",
    department: "",
    description: "",
    weeks: {
      start: 1,
      end: 20
    }
  }
  dialogVisible.value = true
}

// 编辑课程
const handleEdit = (row) => {
  formType.value = "edit"
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除课程
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该课程吗？", "提示", {
      type: "warning"
    })
    await deleteCourse(row._id)
    ElMessage.success("删除成功")
    fetchCourses()
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

    if (formType.value === "add") {
      await createCourse(form.value)
      ElMessage.success("创建成功")
    } else {
      await updateCourse(form.value._id, form.value)
      ElMessage.success("更新成功")
    }

    dialogVisible.value = false
    fetchCourses()
  } catch (error) {
    ElMessage.error(error.message || `${formType.value === "add" ? "创建" : "更新"}失败`)
  } finally {
    submitting.value = false
  }
}

// 下载导入模板
const downloadTemplate = () => {
  const template = [
    {
      课程名称: "示例课程",
      课程代码: "COURSE001",
      教师姓名: "张三",
      开课院系: "计算机系",
      学分: 2,
      课时: 32,
      课程类型: "必修课",
      上课周次: "1-16",
      课程描述: "这是一门示例课程",
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "课程导入模板")
  XLSX.writeFile(wb, "课程导入模板.xlsx")
}

// 处理文件导入
const handleFileChange = async (file) => {
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false })

        if (!rows.length) {
          throw new Error("文件内容为空")
        }

        console.log("Excel原始数据:", rows)

        // 转换数据格式，处理可能的空值
        const courses = rows.map((row, index) => {
          // 检查必填字段
          const teacherName = row["教师姓名"] || row["教师"] || row["任课教师"] || row["teacher"] || row["teacherName"]
          if (!teacherName) {
            throw new Error(`第 ${index + 2} 行缺少教师姓名`)
          }

          const course = {
            name: row["课程名称"] || row["name"] || "",
            code: row["课程代码"] || row["code"] || "",
            teacherName,
            department: row["开课院系"] || row["department"] || "",
            credit: row["学分"] || row["credit"] || "2",
            hours: row["课时"] || row["hours"] || "32",
            type: row["课程类型"] || row["type"] || "必修课",
            weeks: row["上课周次"] || row["weeks"] || "1-20",
            description: row["课程描述"] || row["description"] || "",
            semester: row["学期"] || row["semester"] || "",
            studentCount: row["学生人数"] || row["studentCount"] || "0"
          }

          // 数字类型转换
          course.credit = parseFloat(course.credit) || 2
          course.hours = parseInt(course.hours) || 32
          course.studentCount = parseInt(course.studentCount) || 0

          console.log(`第 ${index + 2} 行数据:`, course)
          return course
        })

        if (!courses.length) {
          throw new Error("没有有效的课程数据")
        }

        const result = await batchImportCourses({ courses })
        console.log("导入结果:", result)

        importResult.value = result
        importResultVisible.value = true

        if (result.successCount > 0) {
          fetchCourses()
        }
      } catch (error) {
        console.error("导入处理错误:", error)
        ElMessage.error(error.message || "导入失败")
      }
    }
    reader.readAsArrayBuffer(file.raw)
  } catch (error) {
    console.error("文件读取错误:", error)
    ElMessage.error(error.message || "文件读取失败")
  }
}

// 重试导入失败项
const handleRetryImport = async () => {
  try {
    const failedCourses = importResult.value.results.errors.map(
      ({ code, name, ...rest }) => ({
        code,
        name,
        ...rest,
      })
    )

    const result = await batchImportCourses({ courses: failedCourses })
    importResult.value = result

    if (result.successCount > 0) {
      fetchCourses()
    }
  } catch (error) {
    ElMessage.error(error.message || "重试失败")
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
