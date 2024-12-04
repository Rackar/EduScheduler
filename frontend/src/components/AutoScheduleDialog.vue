<template>
  <el-dialog v-model="dialogVisible" title="自动排课" width="600px" :close-on-click-modal="false" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <!-- 基本设置 -->
      <el-card class="mb-4">
        <template #header>
          <div class="card-header">
            <span>基本设置</span>
          </div>
        </template>
        <el-form-item label="作息时间" prop="templateId">
          <el-select v-model="form.templateId" class="w-full" placeholder="请选择作息时间模板">
            <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始周" prop="startWeek">
          <el-input-number v-model="form.startWeek" :min="1" :max="20" class="w-32" />
        </el-form-item>
        <el-form-item label="结束周" prop="endWeek">
          <el-input-number v-model="form.endWeek" :min="form.startWeek" :max="20" class="w-32" />
        </el-form-item>
      </el-card>

      <!-- 排课规则 -->
      <el-card class="mb-4">
        <template #header>
          <div class="card-header">
            <span>排课规则</span>
          </div>
        </template>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio label="teacher">教师优先</el-radio>
            <el-radio label="classroom">教室优先</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="教室分配">
          <el-switch v-model="form.considerClassroom" active-text="需要分配教室" inactive-text="使用固定教室" />
        </el-form-item>
        <el-form-item label="连堂课">
          <el-switch v-model="form.allowContinuous" active-text="允许连堂" inactive-text="禁止连堂" />
        </el-form-item>
      </el-card>

      <!-- 高级选项 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>高级选项</span>
            <el-switch v-model="showAdvanced" />
          </div>
        </template>
        <template v-if="showAdvanced">
          <el-form-item label="每日课时">
            <el-input-number v-model="form.maxDailyLessons" :min="4" :max="12" class="w-32" />
          </el-form-item>
          <el-form-item label="避免时段">
            <el-select v-model="form.avoidTimeSlots" multiple collapse-tags class="w-full" placeholder="选择需要避免的时间段">
              <el-option v-for="slot in timeSlots" :key="slot.value" :label="slot.label" :value="slot.value" />
            </el-select>
          </el-form-item>
        </template>
      </el-card>
    </el-form>

    <template #footer>
      <div class="flex justify-end">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          开始排课
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { ElMessage } from "element-plus"
import { getScheduleTemplates } from "@/api/schedule"

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(["update:modelValue", "success"])

// 对话框显示状态
const dialogVisible = ref(false)
const loading = ref(false)
const showAdvanced = ref(false)

// 表单数据
const formRef = ref(null)
const form = ref({
  templateId: "",
  startWeek: 1,
  endWeek: 16,
  priority: "teacher",
  considerClassroom: true,
  allowContinuous: true,
  maxDailyLessons: 8,
  avoidTimeSlots: [],
})

// 表单验证规则
const rules = {
  templateId: [{ required: true, message: "请选择作息时间模板", trigger: "change" }],
  startWeek: [{ required: true, message: "请输入起始周", trigger: "blur" }],
  endWeek: [{ required: true, message: "请输入结束周", trigger: "blur" }],
}

// 作息时间模板列表
const templates = ref([])
const loadTemplates = async () => {
  try {
    const { data } = await getScheduleTemplates()
    templates.value = data
  } catch (error) {
    console.error("获取作息时间模板失败:", error)
    ElMessage.error("获取作息时间模板失败")
  }
}

// 时间段选项
const timeSlots = [
  { label: "第1-2节", value: "1-2" },
  { label: "第3-4节", value: "3-4" },
  { label: "第5-6节", value: "5-6" },
  { label: "第7-8节", value: "7-8" },
  { label: "第9-10节", value: "9-10" },
]

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
  }
)

watch(
  () => dialogVisible.value,
  (val) => {
    emit("update:modelValue", val)
  }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // TODO: 调用自动排课接口
    const { data } = await generateSchedule(form.value)

    ElMessage.success("排课成功")
    dialogVisible.value = false
    emit("success", data)
  } catch (error) {
    console.error("自动排课失败:", error)
    ElMessage.error(error.response?.data?.message || "自动排课失败")
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadTemplates()
})
</script>