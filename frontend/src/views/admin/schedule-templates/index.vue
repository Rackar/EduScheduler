<script>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import axios from "axios"

export default {
  setup() {
    const router = useRouter()
    const templates = ref([])

    // 获取模板列表
    const fetchTemplates = async () => {
      try {
        const { data } = await axios.get("/api/schedule-templates")
        templates.value = data
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "获取模板列表失败")
      }
    }

    onMounted(() => {
      fetchTemplates()
    })

    // 编辑模板
    const editTemplate = (id) => {
      router.push(`/admin/schedule-templates/${id}/edit`)
    }

    // 删除模板
    const deleteTemplate = async (id) => {
      try {
        await axios.delete(`/api/schedule-templates/${id}`)
        await fetchTemplates()
        ElMessage.success("模板删除成功")
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "删除失败")
      }
    }

    return {
      templates,
      router,
      editTemplate,
      deleteTemplate
    }
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">作息时间模板管理</h1>
      <el-button type="primary" @click="router.push('/admin/schedule-templates/new')">
        新建模板
      </el-button>
    </div>

    <div class="grid gap-4">
      <el-card v-for="template in templates" :key="template.id">
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-medium">{{ template.name }}</h3>
              <p class="text-gray-500 text-sm">{{ template.description }}</p>
            </div>
          </div>
        </template>

        <ScheduleTemplatePreview :template="template" />

        <div class="flex justify-end gap-2 mt-4">
          <el-button @click="editTemplate(template.id)">
            编辑
          </el-button>
          <el-button type="danger" @click="deleteTemplate(template.id)">
            删除
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>