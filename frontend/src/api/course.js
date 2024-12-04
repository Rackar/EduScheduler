import request from "@/utils/request";

// 获取课程列表
export const getCourseList = (params) => {
  return request({
    url: "/api/courses",
    method: "get",
    params,
  });
};

// 创建课程
export const createCourse = (data) => {
  return request({
    url: "/api/courses",
    method: "post",
    data,
  });
};

// 更新课程
export const updateCourse = (id, data) => {
  return request({
    url: `/api/courses/${id}`,
    method: "put",
    data,
  });
};

// 删除课程
export const deleteCourse = (id) => {
  return request({
    url: `/api/courses/${id}`,
    method: "delete",
  });
};

// 批量导入课程
export const batchImportCourses = (data) => {
  return request({
    url: "/api/courses/batch-import",
    method: "post",
    data,
  });
};
