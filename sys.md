# 系统设计

## 功能模块

### 1. 租户管理

已完成

### 2. 学时模板管理

已完成

### 3. 课程管理

已完成

### 4. 班级管理

已完成

### 5.排课管理

已有基本框架。
主要问题在自动化排课算法上。

### 6.教室管理

暂不考虑

## 当前任务

自动化排课算法优化：

1.当前的数据已录入。 2.排课逻辑：首先上课周次较长的大课（如 2-19 周）。找到大课和对应的班级，对大课和班级进行排课，然后才考虑周次较小的。3.排课时要考虑班级和考试课表的一致性，同一门课尽量安排在每周的固定时段。4.同一老师的时间需要考虑错开。

已发现 bug： 1.上次排课花费 153 秒，时间过长。同时大量 log 填充看不到有用信息，最后结果还报错。

2.时段优先级参数请暂时忽略。

3.上次排课报错

处理课程: 专业基础知识及能力考核, 周学时: 1, 周次: 19-19
为课程 专业基础知识及能力考核 设置了固定时间段: [ { dayOfWeek: 3, timeSlot: 1 } ]
成功安排课程 专业基础知识及能力考核 在第 19 周星期 3 第 1 节
处理课程: 控制测量实训, 周学时: 1, 周次: 19-19
为课程 控制测量实训 设置了固定时间段: [ { dayOfWeek: 2, timeSlot: 3 } ]
成功安排课程 控制测量实训 在第 19 周星期 2 第 3 节
处理课程: 专业基础知识及能力考核, 周学时: 1, 周次: 19-19
为课程 专业基础知识及能力考核 设置了固定时间段: [ { dayOfWeek: 5, timeSlot: 4 } ]
成功安排课程 专业基础知识及能力考核 在第 19 周星期 5 第 4 节
开始处理第 20 周的课程安排
第 20 周需要排课的课程数量: 0
课表生成完成，总计生成 8230 条排课记录
生成了 8230 条排课记录
生成课表失败: Error: Schedule validation failed: classId: Path `classId` is required., teacherId: Path `teacherId` is required., courseId: Path `courseId` is required., day: Path `day` is required., timeSlot: `1` is not a valid enum value for path `timeSlot`., templateId: Path `templateId` is required.
at ValidationError.inspect (E:\2024\paike\server\node_modules\mongoose\lib\error\validation.js:52:26)  
 at formatValue (node:internal/util/inspect:806:19)  
 at inspect (node:internal/util/inspect:365:10)  
 at formatWithOptionsInternal (node:internal/util/inspect:2273:40)
at formatWithOptions (node:internal/util/inspect:2135:10)
at console.value (node:internal/console/constructor:349:14)
at console.warn (node:internal/console/constructor:382:61)
at exports.generateSchedule (E:\2024\paike\server\controllers\scheduleController.js:173:13)
at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
errors: {
classId: ValidatorError: Path `classId` is required.
at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'required',
path: 'classId',
value: undefined,
reason: undefined,
[Symbol(mongoose#validatorError)]: true
},
teacherId: ValidatorError: Path `teacherId` is required.
at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'required',
path: 'teacherId',
value: undefined,
reason: undefined,
[Symbol(mongoose#validatorError)]: true
},
courseId: ValidatorError: Path `courseId` is required.
at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'required',
path: 'courseId',
value: undefined,
reason: undefined,
[Symbol(mongoose#validatorError)]: true
},
day: ValidatorError: Path `day` is required.  
 at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'required',
path: 'day',
value: undefined,
reason: undefined,
[Symbol(mongoose#validatorError)]: true
},
timeSlot: ValidatorError: `1` is not a valid enum value for path `timeSlot`.
at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'enum',
path: 'timeSlot',
value: '1',
reason: undefined,
[Symbol(mongoose#validatorError)]: true
},
templateId: ValidatorError: Path `templateId` is required.
at validate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1385:13)
at SchemaType.doValidate (E:\2024\paike\server\node_modules\mongoose\lib\schemaType.js:1369:7)
at E:\2024\paike\server\node_modules\mongoose\lib\document.js:3071:18
at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
properties: [Object],
kind: 'required',
path: 'templateId',
value: undefined,
reason: undefined,
[Symbol(mongoose#validatorError)]: true
}
},
\_message: 'Schedule validation failed'
}
[2024-12-05T09:26:08.564Z] POST /generate 500 - 153177ms
