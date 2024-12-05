<template>
  <div class="course-manage">
    <div class="header">
      <el-input v-model="searchQuery" placeholder="搜索课程..." style="width: 200px" clearable />
      <el-button type="primary" @click="openImportDialog">导入课程</el-button>
    </div>

    <el-table v-loading="loading" :data="courses" border style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="课程名称" />
      <el-table-column prop="code" label="课程代码" />
      <el-table-column prop="credit" label="学分" width="80" />
      <el-table-column prop="hours" label="周学时" width="80" />
      <el-table-column prop="type" label="课程类型" width="100" />
      <el-table-column prop="department" label="开课部门" width="120" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination" style="margin-top: 20px; text-align: right">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" />
    </div>

    <ImportCourses ref="importRef" @success="handleImportSuccess" @error="handleImportError" />
  </div>
</template>

<style scoped>
.course-manage {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<script setup>
import { ref, onMounted, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getCourseList, deleteCourse } from "@/api/course"
import ImportCourses from "@/components/ImportCourses.vue"

const loading = ref(false)
const courses = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref("")
const importRef = ref(null)
const importResult = ref({
  successCount: 0,
  failedCount: 0,
  results: {
    success: [],
    errors: [],
  },
})

// 加载课程列表
const loadCourses = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
    }
    const { data } = await getCourseList(params)
    courses.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    console.error("加载课程列表失败:", error)
    ElMessage.error("加载课程列表失败")
  } finally {
    loading.value = false
  }
}

// 处理导入成功
const handleImportSuccess = (result) => {
  console.log("导入响应:", result)

  if (result.success && Array.isArray(result.success)) {
    const successCount = result.success.length
    const errorCount = result.errors?.length || 0

    ElMessage.success(`成功导入 ${successCount} 条课程数据`)
    if (errorCount > 0) {
      ElMessage.warning(`${errorCount} 条数据导入失败`)
    }

    // 更新导入结果统计
    importResult.value = {
      successCount,
      failedCount: errorCount,
      results: {
        success: result.success || [],
        errors: result.errors || [],
      },
    }

    // 重新加载第一页数据
    currentPage.value = 1
    loadCourses()
  } else {
    ElMessage.error("导入失败：返回数据格式错误")
  }
}

// 处理导入失败
const handleImportError = (error) => {
  console.error("导入失败:", error)
  ElMessage.error(error.message || "导入失败")
}

// 打开导入对话框
const openImportDialog = () => {
  importRef.value?.openDialog()
}

// 删除课程
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该课程吗？", "提示", {
      type: "warning",
    })
    await deleteCourse(row.id)
    ElMessage.success("删除成功")
    loadCourses()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

// 监听查询条件变化
watch(
  [searchQuery, currentPage, pageSize],
  () => {
    loadCourses()
  },
  { immediate: true }
)

onMounted(() => {
  loadCourses()
})
</script>
