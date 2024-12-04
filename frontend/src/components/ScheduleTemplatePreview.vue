<script>
/**
 * @typedef {import('@/types/schedule').ScheduleTemplate} ScheduleTemplate
 */

export default {
  props: {
    /** @type {ScheduleTemplate} */
    template: {
      type: Object,
      required: true
    }
  },

  methods: {
    /**
     * @param {string} time
     * @returns {string}
     */
    formatTime(time) {
      return time.substring(0, 5) // 只显示 HH:mm
    }
  }
}
</script>

<template>
  <div class="grid grid-cols-3 gap-4">
    <!-- 上午时段 -->
    <div>
      <h3 class="text-sm font-medium mb-2">上午</h3>
      <div class="space-y-2">
        <div v-for="slot in template.periods.morning" :key="slot.id"
          class="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-sm">
          <span>{{ slot.name }}</span>
          <div class="text-gray-500">
            {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
            <span class="ml-2">({{ slot.creditHours }}学时)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下午时段 -->
    <div>
      <h3 class="text-sm font-medium mb-2">下午</h3>
      <div class="space-y-2">
        <div v-for="slot in template.periods.afternoon" :key="slot.id"
          class="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-sm">
          <span>{{ slot.name }}</span>
          <div class="text-gray-500">
            {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
            <span class="ml-2">({{ slot.creditHours }}学时)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 晚上时段 -->
    <div>
      <h3 class="text-sm font-medium mb-2">晚上</h3>
      <div class="space-y-2">
        <div v-for="slot in template.periods.evening" :key="slot.id"
          class="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-sm">
          <span>{{ slot.name }}</span>
          <div class="text-gray-500">
            {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
            <span class="ml-2">({{ slot.creditHours }}学时)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>