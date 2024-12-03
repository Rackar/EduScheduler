<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between">
      <el-input
        v-model="searchQuery"
        placeholder="搜索教师姓名"
        class="w-60"
        clearable
        @clear="loadTeachers"
        @keyup.enter="loadTeachers"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加教师
      </el-button>
    </div>

    <!-- 教师列表 -->
    <el-table :data="teachers" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="title" label="职称" />
      <el-table-column prop="department" label="所属院系" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" @click="handleEdit(row)" link>
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" @click="handleAvailability(row)" link>
              <el-icon><Timer /></el-icon>时间设置
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
        @size-change="loadTeachers"
        @current-change="loadTeachers"
      />
    </div>

    <!-- 教师表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'add' ? '添加教师' : '编辑教师'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="mt-4"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" class="w-full">
            <el-option label="教授" value="教授" />
            <el-option label="副教授" value="副教授" />
            <el-option label="讲师" value="讲师" />
            <el-option label="助教" value="助教" />
          </el-select>
        </el-form-item>
        <el-form-item label="院系" prop="department">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
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

    <!-- 时间设置对话框 -->
    <el-dialog
      v-model="availabilityDialogVisible"
      title="设置可用时间"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="可用时间段">
          <el-checkbox-group v-model="availabilityForm.timeSlots">
            <div v-for="day in weekDays" :key="day.value" class="mb-4">
              <div class="font-bold mb-2">{{ day.label }}</div>
              <el-checkbox-group v-model="availabilityForm[day.value]">
                <el-checkbox
                  v-for="slot in timeSlots"
                  :key="slot.value"
                  :label="slot.value"
                >
                  {{ slot.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="availabilityDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleAvailabilitySubmit"
            :loading="submitting"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Edit, Delete, Timer } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTeacherList,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherAvailability,
  updateTeacherAvailability
} from '@/api'

// 列表数据
const teachers = ref([])
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
  title: '',
  department: '',
  phone: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请选择职称', trigger: 'change' }],
  department: [{ required: true, message: '请输入院系', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

// 时间设置数据
const availabilityDialogVisible = ref(false)
const currentTeacherId = ref(null)
const availabilityForm = ref({})
const weekDays = [
  { label: '周一', value: 'monday' },
  { label: '周二', value: 'tuesday' },
  { label: '周三', value: 'wednesday' },
  { label: '周四', value: 'thursday' },
  { label: '周五', value: 'friday' }
]
const timeSlots = [
  { label: '第1-2节', value: '1-2' },
  { label: '第3-4节', value: '3-4' },
  { label: '第5-6节', value: '5-6' },
  { label: '第7-8节', value: '7-8' },
  { label: '第9-10节', value: '9-10' }
]

// 加载教师列表
const loadTeachers = async () => {
  loading.value = true
  try {
    const res = await getTeacherList({
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value
    })
    teachers.value = res.items
    total.value = res.total
  } catch (error) {
    ElMessage.error('加载教师列表失败')
  } finally {
    loading.value = false
  }
}

// 添加教师
const handleAdd = () => {
  formType.value = 'add'
  form.value = {
    name: '',
    title: '',
    department: '',
    phone: ''
  }
  dialogVisible.value = true
}

// 编辑教师
const handleEdit = (row) => {
  formType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除教师
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该教师吗？', '提示', {
      type: 'warning'
    })
    await deleteTeacher(row.id)
    ElMessage.success('删除成功')
    loadTeachers()
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
          await createTeacher(form.value)
          ElMessage.success('添加成功')
        } else {
          await updateTeacher(form.value.id, form.value)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        loadTeachers()
      } catch (error) {
        ElMessage.error(formType.value === 'add' ? '添加失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 设置时间
const handleAvailability = async (row) => {
  currentTeacherId.value = row.id
  try {
    const res = await getTeacherAvailability(row.id)
    availabilityForm.value = res
  } catch (error) {
    ElMessage.error('获取时间设置失败')
    return
  }
  availabilityDialogVisible.value = true
}

// 提交时间设置
const handleAvailabilitySubmit = async () => {
  submitting.value = true
  try {
    await updateTeacherAvailability(currentTeacherId.value, availabilityForm.value)
    ElMessage.success('设置成功')
    availabilityDialogVisible.value = false
  } catch (error) {
    ElMessage.error('设置失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTeachers()
})
</script> 