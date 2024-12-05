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
      <el-table-column prop="creditHours" label="学时" width="100" align="center" />
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

// 将嵌套的时间段数据转换为扁平数组
const timeSlotRows = computed(() => {
  if (!props.templateData?.periods) return []

  const rows = []

  // 处理上午时间段
  if (props.templateData.periods.morning) {
    props.templateData.periods.morning.forEach(slot => {
      rows.push({
        ...slot,
        type: 'morning'
      })
    })
  }

  // 处理下午时间段
  if (props.templateData.periods.afternoon) {
    props.templateData.periods.afternoon.forEach(slot => {
      rows.push({
        ...slot,
        type: 'afternoon'
      })
    })
  }

  // 处理晚上时间段
  if (props.templateData.periods.evening) {
    props.templateData.periods.evening.forEach(slot => {
      rows.push({
        ...slot,
        type: 'evening'
      })
    })
  }

  // 按时间排序
  return rows.sort((a, b) => {
    // 首先按类型排序
    const typeOrder = { morning: 1, afternoon: 2, evening: 3 }
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
    evening: "晚上"
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