<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">作息时间模板管理</h1>
      <div class="space-x-2">
        <el-button type="primary" @click="router.push('/admin/schedule-templates/new')">新增模板</el-button>
        <el-button type="success" @click="router.push('/admin/schedule-templates/import')">导入模板</el-button>
      </div>
    </div>

    <el-table :data="templates" border style="width: 100%">
      <el-table-column prop="name" label="模板名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="isActive" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">
            {{ row.isActive ? "当前使用" : "未使用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <div class="space-x-2">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" @click="handlePreview(row)">预览</el-button>
            <el-button type="warning" size="small" :disabled="row.isActive" @click="handleSetActive(row)">
              设为当前模板
            </el-button>
            <el-button type="danger" size="small" :disabled="row.isActive" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 预览对话框 -->
    <ScheduleTemplatePreview v-model="previewVisible" :template-data="selectedTemplate" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import ScheduleTemplatePreview from "@/components/ScheduleTemplatePreview.vue"
import { getScheduleTemplates, deleteScheduleTemplate, setActiveTemplate } from "@/api/schedule"

const router = useRouter()
const templates = ref([])
const previewVisible = ref(false)
const selectedTemplate = ref(null)

// 获取模板列表
const fetchTemplates = async () => {
  try {
    const { data } = await getScheduleTemplates()
    templates.value = data
  } catch (error) {
    console.error("获取模板列表失败:", error)
    ElMessage.error("获取模板列表失败")
  }
}

// 编辑模板
const handleEdit = (template) => {
  if (!template?.id) {
    ElMessage.warning("模板ID不能为空")
    return
  }
  router.push(`/admin/schedule-templates/${template.id}/edit`)
}

// 预览模板
const handlePreview = (template) => {
  if (!template) {
    ElMessage.warning("模板数据不能为空")
    return
  }
  selectedTemplate.value = template
  previewVisible.value = true
}

// 删除模板
const handleDelete = async (template) => {
  if (!template?.id) {
    ElMessage.warning("模板ID不能为空")
    return
  }

  try {
    await ElMessageBox.confirm("确定要删除该模板吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteScheduleTemplate(template.id)
    ElMessage.success("删除成功")
    await fetchTemplates()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除模板失败:", error)
      ElMessage.error("删除模板失败")
    }
  }
}

// 设为当前模板
const handleSetActive = async (template) => {
  if (!template?.id) {
    ElMessage.warning("模板ID不能为空")
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将"${template.name}"设为当前模板吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )

    await setActiveTemplate(template.id)
    ElMessage.success("设置成功")
    await fetchTemplates()
  } catch (error) {
    if (error !== "cancel") {
      console.error("设置当前模板失败:", error)
      ElMessage.error("设置当前模板失败")
    }
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>