import request from "@/utils/request";

// 获取作息时间模板列表
export function getScheduleTemplates() {
  return request({
    url: "/api/schedule-templates",
    method: "get",
  });
}

// 获取单个作息时间模板
export function getScheduleTemplate(id) {
  return request({
    url: `/api/schedule-templates/${id}`,
    method: "get",
  });
}

// 创建作息时间模板
export function createScheduleTemplate(data) {
  return request({
    url: "/api/schedule-templates",
    method: "post",
    data,
  });
}

// 更新作息时间模板
export function updateScheduleTemplate(id, data) {
  return request({
    url: `/api/schedule-templates/${id}`,
    method: "put",
    data,
  });
}

// 删除作息时间模板
export function deleteScheduleTemplate(id) {
  return request({
    url: `/api/schedule-templates/${id}`,
    method: "delete",
  });
}

// 设置当前模板
export function setActiveTemplate(id) {
  return request({
    url: `/api/schedule-templates/${id}/set-active`,
    method: "post",
  });
}

// 获取当前活动模板
export function getCurrentTemplate() {
  return request({
    url: "/api/schedule-templates/active/current",
    method: "get",
  });
}

// 获取课表
export function getSchedules(params) {
  return request({
    url: "/api/schedules",
    method: "get",
    params,
  });
}

// 获取班级周课表 (新版)
export function getClassSchedule(params) {
  return request({
    url: "/api/schedule2/class",
    method: "get",
    params,
  });
}

// 获取教师周课表 (新版)
export function getTeacherSchedule(params) {
  return request({
    url: "/api/schedule2/teacher",
    method: "get",
    params,
  });
}

// 生成课表
export function generateSchedule(data) {
  return request({
    url: "/api/schedules/generate",
    method: "post",
    data,
  });
}

// 导出课表
export function exportSchedule(params) {
  return request({
    url: "/api/schedules/export",
    method: "get",
    params,
    responseType: "blob",
  });
}

// 获取时间段列表
export function getTimeSlots() {
  return request({
    url: "/api/timeslots",
    method: "get",
  });
}

// 获取教室列表
export function getClassrooms(params) {
  return request({
    url: "/api/classrooms",
    method: "get",
    params,
  });
}
