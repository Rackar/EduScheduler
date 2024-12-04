<script>
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import axios from "axios"

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()

    const template = ref({
      id: "",
      name: "",
      description: "",
      periods: {
        morning: [],
        afternoon: [],
        evening: [],
      },
    })

    const isNew = computed(() => route.path.includes("/new"))

    // 验证规则
    const rules = {
      name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
    }

    // 验证单个时段
    const validateTimeSlot = (slot) => {
      const errors = []
      if (!slot.name) {
        errors.push("时段名称不能为空")
      }
      if (!slot.startTime) {
        errors.push("开始时间不能为空")
      }
      if (!slot.endTime) {
        errors.push("结束时间不能为空")
      }
      if (slot.creditHours <= 0) {
        errors.push("学时数必须大于0")
      }
      return errors
    }

    // 验证所有时段
    const validateAllTimeSlots = () => {
      const errors = []
      const periods = ["morning", "afternoon", "evening"]

      periods.forEach(period => {
        template.value.periods[period].forEach((slot, index) => {
          const slotErrors = validateTimeSlot(slot)
          if (slotErrors.length > 0) {
            errors.push(`${period === "morning" ? "上午" : period === "afternoon" ? "下午" : "晚上"}第${index + 1}个时段存在以下错误：\n${slotErrors.join("\n")}`)
          }
        })
      })

      return errors
    }

    // 获取模板数据
    const fetchTemplate = async () => {
      if (!isNew.value) {
        try {
          const templateId = route.params.id || route.path.split("/").pop()
          const { data } = await axios.get(`/api/schedule-templates/${templateId}`)
          template.value = data
        } catch (error) {
          ElMessage.error(error.response?.data?.message || "获取模板数据失败")
          router.push("/admin/schedule-templates")
        }
      }
    }

    onMounted(() => {
      fetchTemplate()
    })

    const addTimeSlot = (period) => {
      template.value.periods[period].push({
        id: crypto.randomUUID(),
        name: "",
        startTime: "08:00",
        endTime: "08:45",
        creditHours: 1,
      })
    }

    const removeTimeSlot = (period, index) => {
      template.value.periods[period].splice(index, 1)
    }

    const saveTemplate = async () => {
      // 验证模板名称
      if (!template.value.name.trim()) {
        ElMessage.warning("请输入模板名称")
        return
      }

      // 验证时段
      const errors = validateAllTimeSlots()
      if (errors.length > 0) {
        ElMessage.warning(errors.join("\n"))
        return
      }

      try {
        if (isNew.value) {
          await axios.post("/api/schedule-templates", template.value)
          ElMessage.success("模板创建成功")
        } else {
          await axios.put(`/api/schedule-templates/${route.params.id}`, template.value)
          ElMessage.success("模板保存成功")
        }
        router.push("/admin/schedule-templates")
      } catch (error) {
        ElMessage.error(error.response?.data?.message || (isNew.value ? "创建" : "保存") + "失败")
      }
    }

    return {
      template,
      isNew,
      router,
      addTimeSlot,
      removeTimeSlot,
      saveTemplate,
      rules
    }
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ isNew ? "新建" : "编辑" }}作息时间模板</h1>
      <div class="flex gap-2">
        <el-button @click="router.back()">
          返回
        </el-button>
        <el-button type="primary" @click="saveTemplate">
          保存
        </el-button>
      </div>
    </div>

    <div class="space-y-6">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <div class="space-y-4">
          <div>
            <span class="text-sm">模板名称</span>
            <el-input v-model="template.name" placeholder="请输入模板名称" :rules="rules.name" required />
          </div>
          <div>
            <span class="text-sm">描述</span>
            <el-input v-model="template.description" type="textarea" placeholder="请输入模板描述" />
          </div>
        </div>
      </el-card>

      <!-- 上午时段 -->
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span>上午时段</span>
            <el-button type="primary" link @click="addTimeSlot('morning')">
              添加时段
            </el-button>
          </div>
        </template>
        <div class="space-y-4">
          <div v-for="(slot, index) in template.periods.morning" :key="slot.id"
            class="grid grid-cols-5 gap-4 items-end">
            <div>
              <span class="text-sm">时段名称</span>
              <el-input v-model="slot.name" placeholder="如：第一节" required :class="{ 'is-error': !slot.name }" />
            </div>
            <div>
              <span class="text-sm">开始时间</span>
              <el-time-select v-model="slot.startTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间"
                required :class="{ 'is-error': !slot.startTime }" />
            </div>
            <div>
              <span class="text-sm">结束时间</span>
              <el-time-select v-model="slot.endTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间" required
                :min-time="slot.startTime" :class="{ 'is-error': !slot.endTime }" />
            </div>
            <div>
              <span class="text-sm">学时数</span>
              <el-input-number v-model="slot.creditHours" :min="0.5" :step="0.5" required
                :class="{ 'is-error': slot.creditHours <= 0 }" />
            </div>
            <el-button type="danger" @click="removeTimeSlot('morning', index)">
              删除
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 下午时段 -->
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span>下午时段</span>
            <el-button type="primary" link @click="addTimeSlot('afternoon')">
              添加时段
            </el-button>
          </div>
        </template>
        <div class="space-y-4">
          <div v-for="(slot, index) in template.periods.afternoon" :key="slot.id"
            class="grid grid-cols-5 gap-4 items-end">
            <div>
              <span class="text-sm">时段名称</span>
              <el-input v-model="slot.name" placeholder="如：第五节" required :class="{ 'is-error': !slot.name }" />
            </div>
            <div>
              <span class="text-sm">开始时间</span>
              <el-time-select v-model="slot.startTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间"
                required :class="{ 'is-error': !slot.startTime }" />
            </div>
            <div>
              <span class="text-sm">结束时间</span>
              <el-time-select v-model="slot.endTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间" required
                :min-time="slot.startTime" :class="{ 'is-error': !slot.endTime }" />
            </div>
            <div>
              <span class="text-sm">学时数</span>
              <el-input-number v-model="slot.creditHours" :min="0.5" :step="0.5" required
                :class="{ 'is-error': slot.creditHours <= 0 }" />
            </div>
            <el-button type="danger" @click="removeTimeSlot('afternoon', index)">
              删除
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 晚上时段 -->
      <el-card>
        <template #header>
          <div class="flex justify-between items-center">
            <span>晚上时段</span>
            <el-button type="primary" link @click="addTimeSlot('evening')">
              添加时段
            </el-button>
          </div>
        </template>
        <div class="space-y-4">
          <div v-for="(slot, index) in template.periods.evening" :key="slot.id"
            class="grid grid-cols-5 gap-4 items-end">
            <div>
              <span class="text-sm">时段名称</span>
              <el-input v-model="slot.name" placeholder="如：第九节" required :class="{ 'is-error': !slot.name }" />
            </div>
            <div>
              <span class="text-sm">开始时间</span>
              <el-time-select v-model="slot.startTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间"
                required :class="{ 'is-error': !slot.startTime }" />
            </div>
            <div>
              <span class="text-sm">结束时间</span>
              <el-time-select v-model="slot.endTime" start="06:00" step="00:05" end="23:00" placeholder="选择时间" required
                :min-time="slot.startTime" :class="{ 'is-error': !slot.endTime }" />
            </div>
            <div>
              <span class="text-sm">学时数</span>
              <el-input-number v-model="slot.creditHours" :min="0.5" :step="0.5" required
                :class="{ 'is-error': slot.creditHours <= 0 }" />
            </div>
            <el-button type="danger" @click="removeTimeSlot('evening', index)">
              删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.is-error {
  border-color: var(--el-color-danger);
}

.is-error:focus {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px rgba(var(--el-color-danger-rgb), 0.2);
}
</style>