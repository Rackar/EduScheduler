<template>
  <el-dialog v-model="dialogVisible" title="作息时间预览" width="800px">
    <el-table :data="timeSlotRows" border>
      <el-table-column prop="type" label="时段" width="100">
        <template #default="{ row }">
          {{ getTypeLabel(row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" width="150" />
      <el-table-column prop="time" label="时间">
        <template #default="{ row }">
          {{ row.startTime }} - {{ row.endTime }}
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  templateData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["update:modelValue"])

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
})

// 按类型分组并排序的时间段
const timeSlotRows = computed(() => {
  if (!props.templateData?.timeSlots) return []

  return props.templateData.timeSlots
    .map(slot => ({
      ...slot,
      type: slot.type || "other" // 确保有类型
    }))
    .sort((a, b) => {
      // 首先按类型排序
      const typeOrder = { morning: 1, afternoon: 2, evening: 3, other: 4 }
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type]
      }
      // 然后按开始时间排序
      return a.startTime.localeCompare(b.startTime)
    })
})

// 获取时段类型标签
const getTypeLabel = (type) => {
  const labels = {
    morning: "上午",
    afternoon: "下午",
    evening: "晚上",
    other: "其他"
  }
  return labels[type] || type
}
</script>

<style scoped>
.el-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
}

.el-table :deep(td) {
  padding: 8px 0;
}
</style>