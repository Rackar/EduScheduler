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

重新构建一个独立的自动化排课算法：

### 1.原始数据

上课班级 学生人数 课程名称 学分 周学时 上课周次 任课教师 课程代码 课程类型 开课院系
工程测量技术 23 级 1-3 班 142 测绘法规基础知识 1.5 2.0-0.0 02-16 张保民 1 必修 土木
工程测量技术 23 级 1-3 班 142 BIM 技术应用基础 3 4.0-0.0 02-16 邓秋菊 2 必修 土木
工程测量技术 23 级 1-3 班 142 土木工程监测测量 3 4.0-0.0 02-16 张保民 3 必修 土木
工程测量技术 23 级 1-3 班 142 GIS 技术与应用 3 4.0-0.0 02-16 段秋亚 4 必修 土木
工程测量技术 23 级 1 班 47 建筑节能技术 1.5 2.0-0.0 02-16 肖利才 5 必修 土木
工程测量技术 23 级 2 班 47 建筑节能技术 1.5 2.0-0.0 02-16 肖利才 6 必修 土木
工程测量技术 23 级 3 班 47 建筑节能技术 1.5 2.0-0.0 02-16 肖利才 7 必修 土木
工程测量技术 23 级 1-3 班 142 工程项目招投标与合同管理 ★ 1.5 2.0-0.0 02-16 吴朋金 8 必修 土木
工程测量技术 23 级 1-3 班 142 地图制图技术 ★ 1.5 2.0-0.0 02-16 邢磊 9 必修 土木
工程测量技术 23 级 1-3 班 142 测绘仪器检测与维修 ★ 1.5 2.0-0.0 02-16 周广勇 10 必修 土木
工程测量技术(学徒制)23 级 1 班 45 测绘法规基础知识 2 2.0-0.0 02-16 企业导师 1 11 必修 土木
工程测量技术(学徒制)23 级 1 班 45 无人机测量技术实训 2 2 16-17 企业导师 2 12 必修 土木
工程测量技术(学徒制)23 级 1 班 45 GIS 实训 2 2 18-19 企业导师 3 13 必修 土木
工程测量技术(学徒制)23 级 1 班 45 地图制图技术 3 4.0-0.0 02-16 企业导师 4 14 必修 土木
工程测量技术 24 级 1-3 班 128 无人机测量技术 1.5 2.0-0.0 02-16 邢磊 106 必修 土木
工程测量技术 24 级 1-3 班 128 土木工程 CAD 1.5 2.0-0.0 02-16 林龙 107 必修 土木
工程测量技术 24 级 1-3 班 128 控制测量技术 3 4.0-0.0 02-16 岳崇伦 108 必修 土木
工程测量技术 24 级 1-3 班 128 GPS 定位技术 1.5 2.0-0.0 02-16 周广勇 109 必修 土木
工程测量技术 24 级 1-3 班 128 工程经济 1.5 2.0-0.0 02-16 刘文新 110 必修 土木
工程测量技术(学徒制)24 级 1 班 49 无人机测量技术 2 2.0-0.0 02-16 邢磊 111 必修 土木
工程测量技术(学徒制)24 级 1 班 49 控制测量技术 3 4.0-0.0 02-16 陈伟标 112 必修 土木
工程测量技术(学徒制)24 级 1 班 49 GPS 定位技术 2 2.0-0.0 02-16 周广勇 113 必修 土木
工程测量技术(学徒制)24 级 1 班 49 GPS 定位技术实训 2 2 17-18 段秋亚 114 必修 土木
工程测量技术(学徒制)24 级 1 班 49 控制测量实训 1 1 19-19 王玉娥 115 必修 土木
工程测量技术(学徒制)24 级 1 班 49 GIS 技术与应用 3 4.0-0.0 02-16 段秋亚 116 必修 土木
工程测量技术(学徒制)24 级 1 班 49 测绘仪器检测与维修 2 2.0-0.0 02-16 周广勇 117 必修 土木

### 2. 已入库表结构

1. 教师
   {
   "\_id": {
   "$oid": "6751d3fd9fc1cc6a9cc213fd"
  },
  "tenant": {
    "$oid": "675061cc65838124b873d15f"
   },
   "school": {
   "$oid": "675061cc65838124b873d161"
  },
  "username": "企业导师31733415933297",
  "password": "$2a$10$ABF0o9SAfNaaRFl38ePUY.qJxLgwRLrhykrk4Zi.rXNrZq9VxTM2u",
   "name": "企业导师 3",
   "email": "企业导师31733415933297@example.com",
   "status": "active",
   "roles": [
   "teacher"
   ],
   "profile": {
   "teachingHours": {
   "current": 0,
   "min": 14,
   "max": 16
   },
   "courses": [
   {
   "$oid": "6751d3fd9fc1cc6a9cc21400"
   }
   ]
   },
   "preferences": {
   "notifications": {
   "email": true,
   "web": true
   },
   "theme": "light"
   },
   "createdAt": {
   "$date": "2024-12-05T16:25:33.298Z"
  },
  "updatedAt": {
    "$date": "2024-12-05T16:25:33.367Z"
   },
   "\_\_v": 1
   }
2. 班级
   {
   "\_id": {
   "$oid": "6751d3fc9fc1cc6a9cc21384"
  },
  "tenant": {
    "$oid": "675061cc65838124b873d15f"
   },
   "school": {
   "$oid": "675061cc65838124b873d161"
  },
  "name": "工程测量技术23级1班",
  "department": "工程测量技术",
  "grade": 2023,
  "classNumber": 1,
  "studentCount": 47,
  "courses": [
    {
      "$oid": "6751d3fc9fc1cc6a9cc2138c"
   },
   {
   "$oid": "6751d3fc9fc1cc6a9cc21397"
    },
    {
      "$oid": "6751d3fc9fc1cc6a9cc213a0"
   },
   {
   "$oid": "6751d3fc9fc1cc6a9cc213ab"
    },
    {
      "$oid": "6751d3fc9fc1cc6a9cc213b4"
   },
   {
   "$oid": "6751d3fc9fc1cc6a9cc213cd"
    },
    {
      "$oid": "6751d3fd9fc1cc6a9cc213d8"
   },
   {
   "$oid": "6751d3fd9fc1cc6a9cc213e3"
    }
  ],
  "status": "active",
  "createdAt": {
    "$date": "2024-12-05T16:25:32.633Z"
   },
   "updatedAt": {
   "$date": "2024-12-05T16:25:33.145Z"
   },
   "\_\_v": 0
   }
3. 课程
   {
   "\_id": {
   "$oid": "6751d3fc9fc1cc6a9cc21397"
  },
  "tenant": {
    "$oid": "675061cc65838124b873d15f"
   },
   "school": {
   "$oid": "675061cc65838124b873d161"
  },
  "name": "BIM技术应用基础",
  "code": "2",
  "credit": 3,
  "hours": 4,
  "type": "必修",
  "department": "土木",
  "description": "",
  "teacher": {
    "$oid": "6751d3fc9fc1cc6a9cc21392"
   },
   "classes": [
   {
   "$oid": "6751d3fc9fc1cc6a9cc21384"
   },
   {
   "$oid": "6751d3fc9fc1cc6a9cc21387"
   },
   {
   "$oid": "6751d3fc9fc1cc6a9cc2138a"
   }
   ],
   "status": "active",
   "studentCount": 0,
   "weeks": {
   "start": 2,
   "end": 16
   },
   "version": 1,
   "deletedAt": null,
   "semester": "2024 秋季",
   "createdAt": {
   "$date": "2024-12-05T16:25:32.726Z"
  },
  "updatedAt": {
    "$date": "2024-12-05T16:25:32.726Z"
   },
   "\_\_v": 0
   }
4. 学时模板
   {
   "\_id": {
   "$oid": "67507518d225410871ba37f6"
  },
  "name": "职高模板",
  "description": "都是两节的大课",
  "periods": {
    "morning": [
      {
        "name": "第一节大课",
        "startTime": "08:00",
        "endTime": "09:50",
        "creditHours": 2,
        "_id": {
          "$oid": "6751a5e2b2ceafff0f6627eb"
   }
   },
   {
   "name": "第二节大课",
   "startTime": "10:00",
   "endTime": "11:50",
   "creditHours": 2,
   "\_id": {
   "$oid": "6751a5e2b2ceafff0f6627ec"
        }
      }
    ],
    "afternoon": [
      {
        "name": "第三节大课",
        "startTime": "14:30",
        "endTime": "16:00",
        "creditHours": 2,
        "_id": {
          "$oid": "6751a5e2b2ceafff0f6627e9"
   }
   },
   {
   "name": "第四节大课",
   "startTime": "16:10",
   "endTime": "18:00",
   "creditHours": 2,
   "\_id": {
   "$oid": "6751a5e2b2ceafff0f6627ea"
        }
      }
    ],
    "evening": [
      {
        "name": "第五节大课",
        "startTime": "18:30",
        "endTime": "20:00",
        "creditHours": 2,
        "_id": {
          "$oid": "6751a5e2b2ceafff0f6627e8"
   }
   }
   ]
   },
   "isDefault": false,
   "createdBy": {
   "$oid": "675061cc65838124b873d165"
  },
  "school": {
    "$oid": "675061cc65838124b873d161"
   },
   "createdAt": {
   "$date": "2024-12-04T15:28:24.406Z"
  },
  "updatedAt": {
    "$date": "2024-12-05T13:08:50.111Z"
   },
   "\_\_v": 0,
   "isActive": true
   }

### 3.排课需求

1.首先分好每个班每门课的上课周次。2-16 代表第 2 周一直学到第 16 周。这种课只需要排一次，每周按同样的时间段上课。 2.其次每门课在本周安排的数量。2.0-0.0 代表每周 1 节大课，两个学时，这部分已处理好，为课程数据表中的 hours 字段。 在学时模版中，每个时间段也有 creditHours 字段与之对应。此模板为大课模板，所以每个时间段都为 2 个学时对应一节大课。 3.一个班的同一门课，在一周内最好不要连续上，如需要上 6 课时三节大课，最好安排在一、三、五。 4.排课要检查老师可用的情况，不能重叠。

### 当前问题

按这个需求，帮我分析最适用的排课算法。先不需要写打码，仅仅说一下思路。(已完成)

分析的不错。我将上面提到的数据放到了 server/mock 目录下。我希望你再新建一个 js 文件用来实现算法。全部使用这些 mock 数据作为初始输入值。按照需求分析的结果实现。（已完成）

不错，运行排课的结果为
{
courseId: '6751d3fd9fc1cc6a9cc2146b',
classId: '6751d3fd9fc1cc6a9cc21449',
teacherId: '6751d3fd9fc1cc6a9cc21468',
timeSlot: {
day: '1',
period: '第一节大课',
startTime: '08:00',
endTime: '09:50',
creditHours: 2
},
weeks: [ 19 ]
}
这样的结构，可以稍作调整。timeSlot 可以改成 timeSlotId，因为都是从学时模板中来的。然后这样的 Schema 放到数据库中，我已经新建一个 Schedule2.js 用来存储 mongoose 模型。(已完成)

好的。根据 Schema，我们可以再新建一个 ScheduleController2 来处理排课的逻辑。接口尽量类似之前的 ScheduleController。 只是排课算法使用换过位置的 Algorithm2，里面的传参模式我也做了修改。ScheduleController2 中我们就不适用 mock 数据了，直接查询数据库。（已完成）

看起来很不错。现在还需要新建一个 scheduleRoute2.js，把接口暴露出去供前端使用。(已完成)

我需要进一步优化排课算法 Algorithm2 的代码。首先就是构造函数其他参数不变，添加一个额外可选参数对象 options，用来接收一些额外的配置。比如说第一项是否允许单双周 allowAlternateWeeks, 例如一门课的周课时为 3，学时模版为 2 学时大课，那么一周需要上 1.5 节课，如果设置 allowAlternateWeeks 为 true，那么一周可以上 2 节，下周上 1 节。如果为 false，那么 1.5 视作 2 节，按照 2 节要求排课。第二项参数 allowConsecutivePeriods: 是否允许连续上课，默认为 false，也就是同一课程在同一班级至少隔一天再上，除非周课次数超出每周 3 次的不能拆到 3 天以下。第三项 maxCoursesPerDay: 每天最大课程数，默认不超过 4 个。注意： 你上次帮我写的方式不对，原构造函数有 mockClasses, mockCourses, mockUsers, mockScheduleTemplates 4 个参数，一个都不能丢。 (已完成)

单双周的识别已经没问题了，但是排课结果并没有按单双周处理。
输出的日志：
课程 测绘仪器检测与维修 处理结果: {
original: 3,
processed: { evenWeek: 1, oddWeek: 2, isAlternate: true }
}
初始化排课算法: {
coursesCount: 26,
timeSlotsCount: 25,
options: {
allowAlternateWeeks: true,
allowConsecutivePeriods: false,
maxCoursesPerDay: 4
}
}
[
{
courseId: '6751d3fd9fc1cc6a9cc21479',
classId: '6751d3fd9fc1cc6a9cc21449',
teacherId: '6751d3fd9fc1cc6a9cc213de',
timeSlot: {
day: '1',
period: '第三节大课',
startTime: '14:30',
endTime: '16:00',
creditHours: 2,
id: '6751a5e2b2ceafff0f6627e9'
},
tearcherName: undefined,
weeks: [
2, 3, 4, 5, 6, 7,
8, 9, 10, 11, 12, 13,
14, 15, 16
]
},
{
courseId: '6751d3fd9fc1cc6a9cc21479',
classId: '6751d3fd9fc1cc6a9cc21449',
teacherId: '6751d3fd9fc1cc6a9cc213de',
timeSlot: {
day: '3',
period: '第三节大课',
startTime: '14:30',
endTime: '16:00',
creditHours: 2,
id: '6751a5e2b2ceafff0f6627e9'
},
tearcherName: undefined,
weeks: [
2, 3, 4, 5, 6, 7,
8, 9, 10, 11, 12, 13,
14, 15, 16
]
}
]
可以看到 weeks 数组中，并没有形成单双周的区分。