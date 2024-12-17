<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <el-loading :fullscreen="false">
        <div class="text-gray-500 mt-4">正在加载统计数据...</div>
      </el-loading>
    </div>



    <!-- 图表展示 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">每日课程与教师分布</h3>
        <div ref="hoursChartRef" class="h-80"></div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">班级课程数量</h3>
        <div ref="typeChartRef" class="h-80"></div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">班级课时统计</h3>
        <el-table :data="classStats" border stripe v-loading="loading">
          <el-table-column prop="className" label="班级" />
          <el-table-column prop="totalHours" label="总课时" />
          <el-table-column prop="weeklyHours" label="周课时" />
        </el-table>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">教师课时统计</h3>
        <el-table :data="teacherStats" border stripe v-loading="loading">
          <el-table-column prop="teacherName" label="教师" />
          <el-table-column prop="totalHours" label="总课时" />
          <el-table-column prop="weeklyHours" label="周课时" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import * as echarts from "echarts"
import { getScheduleStatistics } from "@/api/schedule"

// 统计数据
const classStats = ref([])
const teacherStats = ref([])
const loading = ref(false)

// 图表引用
const hoursChartRef = ref(null)
const typeChartRef = ref(null)
let hoursChart = null
let typeChart = null

// 初始化图表
const initCharts = () => {
  // 每日课程和教师分布图
  hoursChart = echarts.init(hoursChartRef.value)
  hoursChart.setOption({
    title: {
      text: "每日课程与教师分布",
      left: "center"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    legend: {
      data: ["课程数", "教师数"],
      top: 30
    },
    xAxis: {
      type: "category",
      data: ["周一", "周二", "周三", "周四", "周五"],
      axisLabel: {
        interval: 0
      }
    },
    yAxis: {
      type: "value",
      name: "数量",
      minInterval: 1
    },
    series: [
      {
        name: "课程数",
        type: "bar",
        data: [],
        itemStyle: {
          color: "#409EFF"
        }
      },
      {
        name: "教师数",
        type: "bar",
        data: [],
        itemStyle: {
          color: "#67C23A"
        }
      }
    ]
  })

  // 班级课程数量图
  typeChart = echarts.init(typeChartRef.value)
  typeChart.setOption({
    title: {
      text: "班级课程数量",
      left: "center"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: [],
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: "value",
      name: "课程数量",
      minInterval: 1
    },
    series: [{
      type: "bar",
      data: [],
      itemStyle: {
        color: "#67C23A"
      },
      label: {
        show: true,
        position: "top"
      }
    }]
  })

  // 监听窗口大小变化
  const handleResize = () => {
    hoursChart?.resize()
    typeChart?.resize()
  }
  window.addEventListener("resize", handleResize)

  // 将 handleResize 函数保存到组件实例上，以便在卸载时移除
  onUnmounted(() => {
    window.removeEventListener("resize", handleResize)
    hoursChart?.dispose()
    typeChart?.dispose()
  })
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    loading.value = true
    const { data } = await getScheduleStatistics()
    classStats.value = data.classStats
    teacherStats.value = data.teacherStats

    // 更新每日分布图数据
    hoursChart?.setOption({
      series: [
        { data: data.dailyDistribution.lessons },
        { data: data.dailyDistribution.teachers }
      ]
    })

    // 更新班级课程数量图数据
    const classLessonsData = data.classLessonsDistribution
    typeChart?.setOption({
      xAxis: {
        data: classLessonsData.map(item => item.name)
      },
      series: [{
        data: classLessonsData.map(item => item.value)
      }]
    })
  } catch (error) {
    console.error("加载统计数据失败:", error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  initCharts()
  loadStatistics()
})
</script>

<style scoped>
.el-loading-mask {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>