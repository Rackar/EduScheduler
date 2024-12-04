import request from "@/utils/request";

// 获取班级列表
export function getClasses(params) {
  return request({
    url: "/api/classes",
    method: "get",
    params,
  });
}

// 获取单个班级详情
export function getClassDetail(id) {
  return request({
    url: `/api/classes/${id}`,
    method: "get",
  });
}

// 创建班级
export function createClass(data) {
  return request({
    url: "/api/classes",
    method: "post",
    data,
  });
}

// 更新班级信息
export function updateClass(id, data) {
  return request({
    url: `/api/classes/${id}`,
    method: "put",
    data,
  });
}

// 删除班级
export function deleteClass(id) {
  return request({
    url: `/api/classes/${id}`,
    method: "delete",
  });
}

// 添加学生到班级
export function addStudentToClass(data) {
  return request({
    url: "/api/classes/add-student",
    method: "post",
    data,
  });
}

// 为班级添加课程
export function addCourseToClass(data) {
  return request({
    url: "/api/classes/add-course",
    method: "post",
    data,
  });
}
