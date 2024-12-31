<script setup>
import { ref } from "vue"
import { ElMessage, ElLoading } from "element-plus"
import * as XLSX from "xlsx"
import { batchImportCourses } from "@/api/course"

const emit = defineEmits(["success", "error"])
const dialogVisible = ref(false)
const uploadRef = ref()

// 处理文件上传
const handleUpload = async (file) => {
  if (!file) return false

  try {

    const reader = new FileReader()
    let eloading
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false })

        if (!rows.length) {
          throw new Error("文件内容为空")
        }

        console.log("Excel原始数据:", rows)

        // 转换数据格式
        const courses = rows.map((row, index) => {
          // 检查必填字段
          const teacherName = row["教师姓名"] || row["教师"] || row["任课教师"] || row["teacher"] || row["teacherName"]
          if (!teacherName) {
            throw new Error(`第 ${index + 2} 行缺少教师姓名`)
          }

          // 解析课时信息
          let hours = row["周学时"] || row["课时"] || row["hours"] || "2"
          // 处理 "2:0-0.0" 或 "2.0-0.0" 格式
          const hoursMatch = hours.toString().match(/^(\d+(?:\.\d+)?)[:\-]?/)
          if (hoursMatch) {
            hours = parseInt(hoursMatch[1])
          } else {
            hours = 2 // 默认值
          }

          return {
            name: row["课程名称"] || row["name"] || "",
            code: row["课程代码"] || row["code"] || "",
            teacherName,
            department: row["开课院系"] || row["department"] || "",
            credit: parseFloat(row["学分"] || row["credit"] || "2"),
            hours,
            type: row["课程类型"] || row["type"] || "必修课",
            weeks: row["上课周次"] || row["weeks"] || "1-20",
            className: row["上课班级"] || row["班级"] || row["class"] || row["className"] || "",
            description: row["课程描述"] || row["description"] || "",
            semester: row["学期"] || row["semester"] || "",
            studentCount: parseInt(row["学生人数"] || row["studentCount"] || "0")
          }
        })
        eloading = ElLoading.service({
          lock: true,
          text: 'Loading',
          background: 'rgba(0, 0, 0, 0.7)',
        })

        // 发送批量导入请求
        const result = await batchImportCourses({ courses })
        console.log("导入结果:", result)
        eloading.close()
        // 触发成功回调
        emit("success", result.data)

        // 重置上传状态
        uploadRef.value?.clearFiles()
        dialogVisible.value = false

      } catch (error) {
        console.error("导入处理失败:", error)
        emit("error", error)
        eloading.close()
      }
    }

    reader.readAsArrayBuffer(file.raw)
    return false // 阻止自动上传
  } catch (error) {
    console.error("文件处理失败:", error)
    emit("error", error)
  } finally {

  }
}

// 打开导入对话框
const openDialog = () => {
  dialogVisible.value = true
}

defineExpose({
  openDialog,
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="导入课程" width="500px" :close-on-click-modal="false">
    <el-upload ref="uploadRef" class="upload-demo" action="#" :auto-upload="false" :show-file-list="false"
      :on-change="handleUpload" accept=".xlsx,.xls">
      <template #trigger>
        <el-button type="primary">选择文件</el-button>
      </template>
      <template #tip>
        <div class="el-upload__tip">
          请上传Excel文件（.xlsx或.xls格式）
        </div>
      </template>
    </el-upload>
  </el-dialog>
</template>

<style scoped>
.upload-demo {
  text-align: center;
}

.el-upload__tip {
  margin-top: 10px;
  color: #666;
}
</style>