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
        <el-form-item label="每日课程">
          <el-input-number v-model="form.minDailyLessons" :min="1" :max="3" class="w-24" />
          <span class="mx-2">至</span>
          <el-input-number v-model="form.maxDailyLessons" :min="form.minDailyLessons" :max="5" class="w-24" />
          <span class="ml-2">节</span>
        </el-form-item>
        <el-form-item label="课程分布">
          <el-radio-group v-model="form.distribution">
            <el-radio label="balanced">均衡分布</el-radio>
            <el-radio label="concentrated">集中排课</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="单双周">
          <el-switch v-model="form.allowAlternateWeeks" active-text="允许单双周" inactive-text="固定每周" />
        </el-form-item>
      </el-card>

      <!-- 时段设置 -->
      <el-card class="mb-4">
        <template #header>
          <div class="card-header">
            <span>时段设置</span>
          </div>
        </template>
        <!-- 上午时段 -->
        <el-form-item label="上午课程" v-if="currentTemplate?.periods?.morning?.length">
          <el-checkbox-group v-model="form.morningSlots">
            <el-checkbox v-for="slot in currentTemplate.periods.morning" :key="slot.id" :label="slot.id">
              {{ slot.name }} ({{ slot.startTime }}-{{ slot.endTime }})
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 下午时段 -->
        <el-form-item label="下午课程" v-if="currentTemplate?.periods?.afternoon?.length">
          <el-checkbox-group v-model="form.afternoonSlots">
            <el-checkbox v-for="slot in currentTemplate.periods.afternoon" :key="slot.id" :label="slot.id">
              {{ slot.name }} ({{ slot.startTime }}-{{ slot.endTime }})
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 晚上时段 -->
        <el-form-item label="晚上课程" v-if="currentTemplate?.periods?.evening?.length">
          <el-checkbox-group v-model="form.eveningSlots">
            <el-checkbox v-for="slot in currentTemplate.periods.evening" :key="slot.id" :label="slot.id">
              {{ slot.name }} ({{ slot.startTime }}-{{ slot.endTime }})
            </el-checkbox>
          </el-checkbox-group>
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
          <el-form-item label="优先级">
            <el-radio-group v-model="form.priority">
              <el-radio label="teacher">教师优先</el-radio>
              <el-radio label="classroom">教室优先</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="教室分配">
            <el-switch v-model="form.considerClassroom" active-text="需要分配教室" inactive-text="使用固定教室" />
          </el-form-item>
          <el-form-item label="避免时段">
            <el-select v-model="form.avoidTimeSlots" multiple collapse-tags class="w-full" placeholder="选择需要避免的时间段">
              <el-option-group label="上午">
                <el-option v-for="slot in currentTemplate?.periods?.morning" :key="slot.id"
                  :label="`${slot.name} (${slot.startTime}-${slot.endTime})`" :value="slot.id" />
              </el-option-group>
              <el-option-group label="下午">
                <el-option v-for="slot in currentTemplate?.periods?.afternoon" :key="slot.id"
                  :label="`${slot.name} (${slot.startTime}-${slot.endTime})`" :value="slot.id" />
              </el-option-group>
              <el-option-group label="晚上">
                <el-option v-for="slot in currentTemplate?.periods?.evening" :key="slot.id"
                  :label="`${slot.name} (${slot.startTime}-${slot.endTime})`" :value="slot.id" />
              </el-option-group>
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
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { getScheduleTemplates, generateSchedule, getCurrentTemplate } from "@/api/schedule"

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(["update:modelValue", "success"])

// 对话框显示状态
const dialogVisible = ref(false)
const loading = ref(false)
const showAdvanced = ref(false)

// 当前模板
const currentTemplate = ref(null)

// 表单数据
const formRef = ref(null)
const form = ref({
  templateId: "",
  startWeek: 1,
  endWeek: 20,
  minDailyLessons: 2,
  maxDailyLessons: 3,
  distribution: "balanced",
  allowAlternateWeeks: true,
  morningSlots: [],
  afternoonSlots: [],
  eveningSlots: [],
  priority: "teacher",
  considerClassroom: false,
  avoidTimeSlots: [],
})

// 表单验证规则
const rules = {
  templateId: [{ required: true, message: "请选择作息时间模板", trigger: "change" }],
  startWeek: [{ required: true, message: "请输入起始周", trigger: "blur" }],
  endWeek: [{ required: true, message: "请输入结束周", trigger: "blur" }],
}


// 获取当前模板
const fetchCurrentTemplate = async () => {
  try {
    const { data } = await getCurrentTemplate()
    currentTemplate.value = data
    // 预选当前模板的所有时间段
    if (data?.periods) {
      form.value.morningSlots = data.periods.morning?.map(slot => slot.id) || []
      form.value.afternoonSlots = data.periods.afternoon?.map(slot => slot.id) || []
      form.value.eveningSlots = data.periods.evening?.map(slot => slot.id) || []
    }
  } catch (error) {
    console.error("获取当前模板失败:", error)
    ElMessage.error("获取当前模板失败")
  }
}

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
    if (val) {
      fetchCurrentTemplate()
    }
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

    // 处理时间段
    const availableSlots = [
      ...form.value.morningSlots,
      ...form.value.afternoonSlots,
      ...form.value.eveningSlots,
    ]

    const data = {
      ...form.value,
      availableSlots,
      templateId: currentTemplate.value.id,
    }

    const result = await generateSchedule(data)
    ElMessage.success("排课成功")
    dialogVisible.value = false
    emit("success", result.data)
  } catch (error) {
    console.error("自动排课失败:", error)
    ElMessage.error(error.response?.data?.message || "自动排课失败")
  } finally {
    loading.value = false
  }
}
</script>