<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between">
      <el-input
        v-model="searchQuery"
        placeholder="搜索教室编号"
        class="w-60"
        clearable
        @clear="loadClassrooms"
        @keyup.enter="loadClassrooms"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加教室
      </el-button>
    </div>

    <!-- 教室列表 -->
    <el-table :data="classrooms" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="building" label="教学楼" />
      <el-table-column prop="room" label="教室号" />
      <el-table-column prop="type" label="教室类型" />
      <el-table-column prop="capacity" label="容量" width="100" />
      <el-table-column prop="equipment" label="设备配置" />
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
        @size-change="loadClassrooms"
        @current-change="loadClassrooms"
      />
    </div>

    <!-- 教室表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'add' ? '添加教室' : '编辑教室'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="mt-4"
      >
        <el-form-item label="教学楼" prop="building">
          <el-input v-model="form.building" />
        </el-form-item>
        <el-form-item label="教室号" prop="room">
          <el-input v-model="form.room" />
        </el-form-item>
        <el-form-item label="教室类型" prop="type">
          <el-select v-model="form.type" class="w-full">
            <el-option label="普通教室" value="普通教室" />
            <el-option label="多媒体教室" value="多媒体教室" />
            <el-option label="实验室" value="实验室" />
            <el-option label="阶梯教室" value="阶梯教室" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="form.capacity" :min="0" :max="500" />
        </el-form-item>
        <el-form-item label="设备配置" prop="equipment">
          <el-checkbox-group v-model="form.equipment">
            <el-checkbox label="投影仪">投影仪</el-checkbox>
            <el-checkbox label="电脑">电脑</el-checkbox>
            <el-checkbox label="音响">音响</el-checkbox>
            <el-checkbox label="空调">空调</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="form.notes"
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
import { getClassrooms } from '@/api'

// 列表数据
const classrooms = ref([])
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
  building: '',
  room: '',
  type: '普通教室',
  capacity: 60,
  equipment: [],
  notes: ''
})

// 表单验证规则
const rules = {
  building: [{ required: true, message: '请输入教学楼', trigger: 'blur' }],
  room: [{ required: true, message: '请输入教室号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择教室类型', trigger: 'change' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'blur' }]
}

// 加载教室列表
const loadClassrooms = async () => {
  loading.value = true
  try {
    const res = await getClassrooms({
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value
    })
    classrooms.value = res.items
    total.value = res.total
  } catch (error) {
    ElMessage.error('加载教室列表失败')
  } finally {
    loading.value = false
  }
}

// 添加教室
const handleAdd = () => {
  formType.value = 'add'
  form.value = {
    building: '',
    room: '',
    type: '普通教室',
    capacity: 60,
    equipment: [],
    notes: ''
  }
  dialogVisible.value = true
}

// 编辑教室
const handleEdit = (row) => {
  formType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除教室
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该教室吗？', '提示', {
      type: 'warning'
    })
    // await deleteClassroom(row.id)
    ElMessage.success('删除成功')
    loadClassrooms()
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
        // if (formType.value === 'add') {
        //   await createClassroom(form.value)
        // } else {
        //   await updateClassroom(form.value.id, form.value)
        // }
        ElMessage.success(formType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        loadClassrooms()
      } catch (error) {
        ElMessage.error(formType.value === 'add' ? '添加失败' : '更新失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadClassrooms()
})
</script> 