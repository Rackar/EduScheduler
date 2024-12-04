import request from "@/utils/request";

// 获取课程表
export function getSchedule(params) {
  return request({
    url: "/api/schedule",
    method: "get",
    params,
  });
}

// 获取作息时间模板列表
export function getScheduleTemplates(params) {
  return request({
    url: "/api/schedule-templates",
    method: "get",
    params,
  });
}

// 获取作息时间模板详情
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

// 生成课程表
export function generateSchedule(data) {
  return request({
    url: "/api/schedule/generate",
    method: "post",
    data,
  });
}

// 手动调整课程安排
export function adjustSchedule(data) {
  return request({
    url: "/api/schedule/adjust",
    method: "put",
    data,
  });
}

// 检查时间冲突
export function checkConflicts(data) {
  return request({
    url: "/api/schedule/check-conflicts",
    method: "post",
    data,
  });
}

// 导出课程表
export function exportSchedule(params) {
  return request({
    url: "/api/schedule/export",
    method: "get",
    params,
    responseType: "blob", // 用于文件下载
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
