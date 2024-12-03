<template>
  <div class="container mx-auto px-4 py-8">
    <el-card class="w-full">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">排课系统</h1>
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            新建课程
          </el-button>
        </div>
      </template>
      <div class="space-y-4">
        <el-alert
          title="欢迎使用排课系统"
          type="success"
          :closable="false"
        />
        <!-- 这里可以添加更多内容 -->
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
</script>

<style scoped>
/* 可以添加组件特定的样式 */
</style> 