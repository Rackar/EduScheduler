<template>
  <div class="space-y-6">


    <!-- 图表展示 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">每日课程与教师分布</h3>
        <div ref="hoursChartRef" class="h-80"></div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">课程类型分布</h3>
        <div ref="typeChartRef" class="h-80"></div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">班级课时统计</h3>
        <el-table :data="classStats" border stripe>
          <el-table-column prop="className" label="班级" />
          <el-table-column prop="totalHours" label="总课时" />
          <el-table-column prop="weeklyHours" label="周课时" />
        </el-table>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">教师课时统计</h3>
        <el-table :data="teacherStats" border stripe>
          <el-table-column prop="teacherName" label="教师" />
          <el-table-column prop="totalHours" label="总课时" />
          <el-table-column prop="weeklyHours" label="周课时" />
        </el-table>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import * as echarts from "echarts"
import { getScheduleStatistics } from "@/api/schedule"

// 统计数据
const classStats = ref([])
const teacherStats = ref([])


// 图表引用
const hoursChartRef = ref(null)
const typeChartRef = ref(null)

// 初始化图表
const initCharts = () => {
  // 每日课程和教师分布图
  const hoursChart = echarts.init(hoursChartRef.value)
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
      data: ["课时数", "教师数"],
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
        name: "课时数",
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

  // 课程类型分布图
  const typeChart = echarts.init(typeChartRef.value)
  typeChart.setOption({
    title: {
      text: "课程类型分布",
      left: "center"
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left",
      top: 30
    },
    series: [{
      type: "pie",
      radius: "50%",
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)"
        }
      }
    }]
  })

  return { hoursChart, typeChart }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const { data } = await getScheduleStatistics()
    classStats.value = data.classStats
    teacherStats.value = data.teacherStats

    // 更新图表数据
    const { hoursChart, typeChart } = initCharts()

    // 更新每日分布图数据
    hoursChart.setOption({
      series: [
        { data: data.dailyDistribution.lessons },
        { data: data.dailyDistribution.teachers }
      ]
    })

    // 更新课程类型分布图数据
    typeChart.setOption({
      series: [{
        data: data.courseTypeDistribution
      }]
    })
  } catch (error) {
    console.error("加载统计数据失败:", error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStatistics()
})
</script>