<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- 搜索和操作栏 -->
    <div class="mb-4 flex justify-between">
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索课程名称" class="w-60" clearable @clear="loadCourses"
          @keyup.enter="loadCourses">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-switch v-model="showInactive" active-text="显示历史版本" inactive-text="仅显示当前版本" />
      </div>

      <div class="flex space-x-2">
        <input type="file" ref="fileInputRef" :key="Date.now()" accept=".xlsx,.xls" class="hidden"
          @change="handleExcelImport" />
        <el-button type="success" @click="triggerImport">
          <el-icon>
            <Upload />
          </el-icon>导入Excel
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon>
            <Plus />
          </el-icon>添加课程
        </el-button>
      </div>
    </div>

    <!-- 课程列表 -->
    <el-table :data="courses" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" />
      <el-table-column prop="name" label="课程名称" />
      <el-table-column prop="code" label="课程代码" />
      <el-table-column prop="credit" label="学分" width="80" />
      <el-table-column prop="hours" label="课时" width="80" />
      <el-table-column prop="type" label="课程类型" />
      <el-table-column prop="department" label="开课院系" />
      <el-table-column prop="teacherName" label="任课教师" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '当前版本' : '历史版本' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button v-if="row.status === 'active'" type="primary" @click="handleEdit(row)" link>
              <el-icon>
                <Edit />
              </el-icon>编辑
            </el-button>
            <el-button v-if="row.status === 'active'" type="danger" @click="handleDelete(row)" link>
              <el-icon>
                <Delete />
              </el-icon>删除
            </el-button>
            <el-button type="info" @click="handleViewHistory(row)" link>
              <el-icon>
                <InfoFilled />
              </el-icon>历史
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="loadCourses"
        @current-change="loadCourses" />
    </div>

    <!-- 课程表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formType === 'add' ? '添加课程' : '编辑课程'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="课程代码" prop="code">
          <el-input v-model="form.code" :disabled="formType === 'edit'" />
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
        <el-form-item label="上课周次">
          <div class="flex items-center space-x-2">
            <el-form-item prop="weeks.start" class="mb-0">
              <el-input-number v-model="form.weeks.start" :min="1" :max="20" />
            </el-form-item>
            <span>-</span>
            <el-form-item prop="weeks.end" class="mb-0">
              <el-input-number v-model="form.weeks.end" :min="1" :max="20" />
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ref, onMounted, watch } from 'vue'
import { Search, Plus, Edit, Delete, Upload, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  getCourseList,
  createCourse,
  updateCourse,
  deleteCourse,
  batchImportCourses
} from '@/api'

// 列表数据
const courses = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')
const showInactive = ref(false)

// 文件上传相关
const fileInputRef = ref(null)

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
  description: '',
  weeks: {
    start: 1,
    end: 20
  }
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  credit: [{ required: true, message: '请输入学分', trigger: 'blur' }],
  hours: [{ required: true, message: '请输入课时', trigger: 'blur' }],
  type: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
  department: [{ required: true, message: '请输入开课院系', trigger: 'blur' }],
  'weeks.start': [{ required: true, message: '请输入开始周次', trigger: 'blur' }],
  'weeks.end': [{ required: true, message: '请输入结束周次', trigger: 'blur' }]
}

// 加载课程列表
const loadCourses = async () => {
  loading.value = true
  try {
    console.log('正在加载课程列表...', {
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      includeInactive: showInactive.value
    });

    const res = await getCourseList({
      page: currentPage.value,
      size: pageSize.value,
      query: searchQuery.value,
      includeInactive: showInactive.value
    });

    console.log('课程列表响应:', res);

    if (!res) {
      throw new Error('响应数据为空');
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
    description: '',
    weeks: {
      start: 1,
      end: 20
    }
  }
  dialogVisible.value = true
}

// 编辑课程
const handleEdit = (row) => {
  formType.value = 'edit'
  form.value = {
    ...row,
    weeks: row.weeks || { start: 1, end: 20 }
  }
  dialogVisible.value = true
}

// 查看课程历史版本
const handleViewHistory = async (row) => {
  try {
    const versions = row.history || [];
    if (versions.length === 0) {
      ElMessage.info('该课程暂无历史版本');
      return;
    }

    const versionList = versions.map(v => `
      <div class="mb-2 p-2 border rounded">
        <div>版本 ${v.version}</div>
        <div>状态: ${v.status}</div>
        <div>创建时间: ${new Date(v.createdAt).toLocaleString()}</div>
        ${v.deletedAt ? `<div>删除时间: ${new Date(v.deletedAt).toLocaleString()}</div>` : ''}
        ${v.deletedReason ? `<div>删除原因: ${v.deletedReason}</div>` : ''}
      </div>
    `).join('');

    await ElMessageBox.alert(
      `<div class="max-h-96 overflow-y-auto">${versionList}</div>`,
      '课程历史版本',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      }
    );
  } catch (error) {
    console.error('查看历史版本失败:', error);
  }
};

// 删除课程
const handleDelete = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入删除原因（可选）',
      '删除课程',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入删除原因',
        inputValidator: (value) => true,
        type: 'warning'
      }
    );

    await deleteCourse(row._id, { reason });
    ElMessage.success('删除成功');
    loadCourses();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除课程失败:', error);
      ElMessage.error('删除失败: ' + (error.message || '未知错误'));
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        if (formType.value === 'add') {
          await createCourse(form.value);
          ElMessage.success('添加成功');
        } else {
          const res = await updateCourse(form.value._id, form.value);
          ElMessage.success(res.data.previousVersion ? '更新成功（创建新版本）' : '更新成功');
        }
        dialogVisible.value = false;
        loadCourses();
      } catch (error) {
        console.error(formType.value === 'add' ? '添加失败:' : '更新失败:', error);
        ElMessage.error((formType.value === 'add' ? '添加' : '更新') + '失败: ' + (error.message || '未知错误'));
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 处理Excel导入
const handleExcelImport = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.log('没有选择文件');
    return;
  }

  loading.value = true;
  try {
    const workbook = XLSX.read(await file.arrayBuffer());
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 数据验证
    const missingFields = [];
    const requiredFields = ['课程名称', '任课教师', '开课院系', '课程代码'];

    // 检查是否所有必需字段都存在
    for (const field of requiredFields) {
      if (!jsonData[0] || !(field in jsonData[0])) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Excel文件缺少必需的字段：${missingFields.join(', ')}`);
    }

    // 转换Excel数据为后端需要的格式
    const courses = jsonData.map((row, index) => {
      // 验证当前行的必需字段
      for (const field of requiredFields) {
        if (!row[field]) {
          throw new Error(`第 ${index + 2} 行缺少${field}`);
        }
      }

      return {
        name: row['课程名称'],
        code: row['课程代码'],
        credit: row['学分'],
        hours: row['课时'],
        type: row['课程类型'],
        department: row['开课院系'],
        teacherName: row['任课教师'],
        description: row['课程描述'] || '',
        className: row['上课班级'],
        studentCount: row['学生人数'],
        weekInfo: row['上课周次']
      };
    });

    const response = await batchImportCourses({ courses });

    ElMessage.success(`导入完成！新建：${response.data.created}条，更新：${response.data.updated}条，失败：${response.data.failed}条`);

    if (response.data.failed > 0) {
      console.error('导入失败的记录：', response.data.details.errors);
      ElMessage.warning({
        message: '部分数据导入失败，请检查控制台了解详情',
        duration: 5000
      });
    }

    loadCourses();

    // 清除文件输入
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  } catch (error) {
    console.error('导入失败：', error);
    ElMessage.error({
      message: '导入失败：' + (error.message || '未知错误'),
      duration: 5000
    });
  } finally {
    loading.value = false;
  }
};

// 触发文件选择
const triggerImport = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
};

// 监听显示非活动课程的变化
watch(showInactive, () => {
  loadCourses();
});

onMounted(() => {
  loadCourses();
});
</script>
