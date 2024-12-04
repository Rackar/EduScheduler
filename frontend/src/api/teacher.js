import request from "@/utils/request";

// 获取教师列表
export const getTeacherList = (params) => {
  return request({
    url: "/api/teachers",
    method: "get",
    params,
  });
};

// 获取单个教师
export const getTeacherById = (id) => {
  return request({
    url: `/api/teachers/${id}`,
    method: "get",
  });
};

// 创建教师
export const createTeacher = (data) => {
  return request({
    url: "/api/teachers",
    method: "post",
    data,
  });
};

// 更新教师
export const updateTeacher = (id, data) => {
  return request({
    url: `/api/teachers/${id}`,
    method: "put",
    data,
  });
};

// 删除教师
export const deleteTeacher = (id) => {
  return request({
    url: `/api/teachers/${id}`,
    method: "delete",
  });
};

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
