import request from "@/utils/request";

// 获取课程表
export function getSchedule(params) {
  return request({
    url: "/api/schedule",
    method: "get",
    params,
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
