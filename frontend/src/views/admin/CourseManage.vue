<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between">
      <el-input
        v-model="searchQuery"
        placeholder="搜索课程名称"
        class="w-60"
        clearable
        @clear="loadCourses"
        @keyup.enter="loadCourses"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加课程
      </el-button>
    </div>

    <!-- 课程列表 -->
    <el-table :data="courses" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="课程名称" />
      <el-table-column prop="code" label="课程代码" />
      <el-table-column prop="credit" label="学分" width="80" />
      <el-table-column prop="hours" label="课时" width="80" />
      <el-table-column prop="type" label="课程类型" />
      <el-table-column prop="department" label="开课院系" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" @click="handleEdit(row)" link>
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" @click="handleDelete(row)" link>
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadCourses"
        @current-change="loadCourses"
      />
    </div>

    <!-- 课程表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'add' ? '添加课程' : '编辑课程'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="mt-4"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="课程代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input-number v-model="form.credit" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="课时" prop="hours">
          <el-input-number v-model="form.hours" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="课程类型" prop="type">
          <el-select v-model="form.type" class="w-full">
            <el-option label="必修课" value="必修课" />
            <el-option label="选修课" value="选修课" />
            <el-option label="实验课" value="实验课" />
          </el-select>
        </el-form-item>
        <el-form-item label="开课院系" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCourseList,
  createCourse,
  updateCourse,
  deleteCourse
} from '@/api'

// 列表数据
const courses = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')

// 表单数据
const dialogVisible = ref(false)
const formType = ref('add')
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  name: '',
  code: '',
  credit: 2,
  hours: 32,
  type: '必修课',
  department: '',
  description: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  credit: [{ required: true, message: '请输入学分', trigger: 'blur' }],
  hours: [{ required: true, message: '请输入课时', trigger: 'blur' }],
  type: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
  department: [{ required: true, message: '请输入开课院系', trigger: 'blur' }]
}

// 加载课程列表
const loadCourses = async () => {
  loading.value = true
  try {
    console.log('正在加载课程列表...', {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value
    });

    const res = await getCourseList({
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value
    });

    console.log('课程列表响应:', res);

    if (!res) {
      throw new Error('响应数据为空');
    }

    if (!Array.isArray(res.items)) {
      console.error('响应数据格式错误:', res);
      throw new Error('响应数据格式错误');
    }

    courses.value = res.items;
    total.value = res.total || 0;
    
    console.log('课程列表加载成功:', {
      items: courses.value.length,
      total: total.value
    });
  } catch (error) {
    console.error('加载课程列表失败:', error);
    ElMessage.error(error.message || '加载课程列表失败');
  } finally {
    loading.value = false;
  }
}

// 添加课程
const handleAdd = () => {
  formType.value = 'add'
  form.value = {
    name: '',
    code: '',
    credit: 2,
    hours: 32,
    type: '必修课',
    department: '',
    description: ''
  }
  dialogVisible.value = true
}

// 编辑课程
const handleEdit = (row) => {
  formType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除课程
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程吗？', '提示', {
      type: 'warning'
    })
    await deleteCourse(row.id)
    ElMessage.success('删除成功')
    loadCourses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (formType.value === 'add') {
          await createCourse(form.value)
          ElMessage.success('添加成功')
        } else {
          await updateCourse(form.value.id, form.value)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        loadCourses()
      } catch (error) {
        ElMessage.error(formType.value === 'add' ? '添加失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadCourses()
})
</script> 