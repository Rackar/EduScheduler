<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-900">404</h1>
      <p class="mt-4 text-xl text-gray-600">页面未找到</p>
      <el-button type="primary" class="mt-8" @click="router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"

const router = useRouter()
</script>