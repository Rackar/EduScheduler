import request from "@/utils/request";

// 获取教师列表
export function getTeacherList(params) {
  return request({
    url: "/api/users/teachers",
    method: "get",
    params,
  });
}

// 获取单个教师详情
export function getTeacherDetail(id) {
  return request({
    url: `/api/users/${id}`,
    method: "get",
  });
}

// 创建教师
export function createTeacher(data) {
  return request({
    url: "/api/users/register",
    method: "post",
    data: {
      ...data,
      role: "teacher",
    },
  });
}

// 更新教师信息
export function updateTeacher(id, data) {
  return request({
    url: `/api/users/${id}`,
    method: "put",
    data,
  });
}

// 删除教师
export function deleteTeacher(id) {
  return request({
    url: `/api/users/${id}`,
    method: "delete",
  });
}

// 获取教师可用时间
export function getTeacherAvailability(id) {
  return request({
    url: `/api/users/${id}/availability`,
    method: "get",
  });
}

// 更新教师可用时间
export function updateTeacherAvailability(id, data) {
  return request({
    url: `/api/users/${id}/availability`,
    method: "put",
    data,
  });
}
