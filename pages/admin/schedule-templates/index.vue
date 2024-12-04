<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ScheduleTemplate } from "~/types/schedule"

const templates = ref<ScheduleTemplate[]>([])
const { data: scheduleTemplates } = await useFetch("/api/schedule-templates")

const editTemplate = (id: string) => {
  navigateTo(`/admin/schedule-templates/${id}/edit`)
}

const deleteTemplate = async (id: string) => {
  // 添加确认对话框
  const confirmed = await confirm("确定要删除该模板吗？")
  if (!confirmed) return

  try {
    await $fetch(`/api/schedule-templates/${id}`, {
      method: "DELETE",
    })
    // 从列表中移除
    templates.value = templates.value.filter(t => t.id !== id)
  } catch (error) {
    console.error("删除模板失败:", error)
  }
}

// 获取模板列表
onMounted(() => {
  templates.value = scheduleTemplates.value || []
})
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">作息时间模板管理</h1>
      <Button @click="navigateTo('/admin/schedule-templates/new')">
        新建模板
      </Button>
    </div>

    <div class="grid gap-4">
      <Card v-for="template in templates" :key="template.id">
        <CardHeader>
          <CardTitle>{{ template.name }}</CardTitle>
          <CardDescription>{{ template.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- 显示模板预览 -->
          <ScheduleTemplatePreview :template="template" />
        </CardContent>
        <CardFooter class="flex justify-end gap-2">
          <Button variant="outline" @click="editTemplate(template.id)">
            编辑
          </Button>
          <Button variant="destructive" @click="deleteTemplate(template.id)">
            删除
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>