import request from "@/utils/request";

// 获取课程列表
export function getCourseList(params) {
  return request({
    url: "/api/courses",
    method: "get",
    params,
  });
}

// 获取单个课程详情
export function getCourseDetail(id) {
  return request({
    url: `/api/courses/${id}`,
    method: "get",
  });
}

// 创建课程
export function createCourse(data) {
  return request({
    url: "/api/courses",
    method: "post",
    data,
  });
}

// 更新课程信息
export function updateCourse(id, data) {
  return request({
    url: `/api/courses/${id}`,
    method: "put",
    data,
  });
}

// 删除课程
export function deleteCourse(id) {
  return request({
    url: `/api/courses/${id}`,
    method: "delete",
  });
}

// 批量导入课程
export function batchImportCourses(data) {
  return request({
    url: "/api/courses/batch-import",
    method: "post",
    data,
  });
}
