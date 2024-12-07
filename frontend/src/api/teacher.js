import request from "@/utils/request";

// 获取教师列表（分页）
export function getTeacherList(params) {
  return request({
    url: "/api/teachers",
    method: "get",
    params,
  });
}

// 获取全部教师列表（不分页）
export function getAllTeachers() {
  return request({
    url: "/api/teachers/all",
    method: "get",
  });
}

// 获取单个教师
export function getTeacher(id) {
  return request({
    url: `/api/teachers/${id}`,
    method: "get",
  });
}

// 创建教师
export function createTeacher(data) {
  return request({
    url: "/api/teachers",
    method: "post",
    data,
  });
}

// 更新教师
export function updateTeacher(id, data) {
  return request({
    url: `/api/teachers/${id}`,
    method: "put",
    data,
  });
}

// 删除教师
export function deleteTeacher(id) {
  return request({
    url: `/api/teachers/${id}`,
    method: "delete",
  });
}

// 获取教师可用时间
export const getTeacherAvailability = (id) => {
  return request({
    url: `/api/teachers/${id}/availability`,
    method: "get",
  });
};

// 更新教师可用时间
export const updateTeacherAvailability = (id, data) => {
  return request({
    url: `/api/teachers/${id}/availability`,
    method: "put",
    data,
  });
};
