import request from "@/utils/request";

// 获取班级列表
export const getClassList = (params) => {
  return request({
    url: "/api/classes",
    method: "get",
    params,
  });
};

// 为了向后兼容，保留 getClasses 方法
export const getClasses = getClassList;

// 获取单个班级详情
export const getClassById = (id) => {
  return request({
    url: `/api/classes/${id}`,
    method: "get",
  });
};

// 创建班级
export const createClass = (data) => {
  return request({
    url: "/api/classes",
    method: "post",
    data,
  });
};

// 更新班级
export const updateClass = (id, data) => {
  return request({
    url: `/api/classes/${id}`,
    method: "put",
    data,
  });
};

// 删除班级
export const deleteClass = (id) => {
  return request({
    url: `/api/classes/${id}`,
    method: "delete",
  });
};

// 添加学生到班级
export const addStudentToClass = (data) => {
  return request({
    url: "/api/classes/add-student",
    method: "post",
    data,
  });
};

// 为班级添加课程
export const addCourseToClass = (data) => {
  return request({
    url: "/api/classes/add-course",
    method: "post",
    data,
  });
};
