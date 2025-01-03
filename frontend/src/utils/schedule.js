/**
 * 将周次数组转换为易读的文本描述
 * @param {number[]} weeks - 周次数组
 * @returns {string} - 格式化后的文本，如"1-4周,7-9周,12周"
 */
export const formatWeeks = (weeks) => {
  if (!weeks?.length) return "";

  // 排序并去重
  const sortedWeeks = [...new Set(weeks)].sort((a, b) => a - b);

  const ranges = [];
  let start = sortedWeeks[0];
  let prev = start;

  for (let i = 1; i <= sortedWeeks.length; i++) {
    const current = sortedWeeks[i];
    if (current !== prev + 1) {
      // 处理区间
      if (start === prev) {
        ranges.push(`${start}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = current;
    }
    prev = current;
  }

  return ranges.join(",") + "周";
};

/**
 * 获取课程单元格的样式类
 * @param {Object} schedule - 课程安排对象
 * @returns {string} - 样式类名
 */
export const getCellClass = (schedule) => {
  if (!schedule) return "";

  const baseClass = "bg-opacity-20";
  switch (schedule.status) {
    case "draft":
      return `${baseClass} bg-blue-500`;
    case "confirmed":
      return `${baseClass} bg-green-500`;
    case "conflict":
      return `${baseClass} bg-red-500`;
    default:
      return baseClass;
  }
};

/**
 * 将时间段数组转换为表格数据
 * @param {Object} template - 课表模板
 * @param {Array} scheduleData - 课程安排数据
 * @returns {Array} - 表格数据
 */
export const convertToTableData = (template, scheduleData = []) => {
  if (!template?.periods) return [];

  // 获取所有时间段
  const timeSlots = [
    ...(template.periods.morning || []),
    ...(template.periods.afternoon || []),
    ...(template.periods.evening || []),
  ].map((slot, index) => ({
    ...slot,
    id: slot.id || slot._id || `time-${index + 1}`,
    startTime: slot.startTime || slot.time?.split("-")[0] || "",
    endTime: slot.endTime || slot.time?.split("-")[1]?.split("\\n")[0] || "",
    name: slot.name || slot.time?.split("\\n")[1] || `第${index + 1}节`,
  }));

  const result = timeSlots.map((slot) => {
    const row = {
      time: `${slot.startTime}-${slot.endTime}\n${slot.name}`,
      timeSlotId: slot.id,
    };

    // 添加每天的课程
    ["周一", "周二", "周三", "周四", "周五"].forEach((day, index) => {
      const daySchedules = scheduleData.filter(
        (s) =>
          String(s.timeSlotId) === String(slot.id) && s.dayOfWeek === index + 1
      );

      if (daySchedules.length > 0) {
        // 如果有多个课程，创建一个数组
        row[day] = daySchedules.map((schedule) => ({
          id: schedule.id,
          timeSlotId: schedule.timeSlotId,
          dayOfWeek: schedule.dayOfWeek,
          courseName: schedule.courseName,
          teacherName: schedule.teacherName,
          status: schedule.status,
          weeks: schedule.weeks || [],
        }));
      } else {
        row[day] = null;
      }
    });

    return row;
  });

  return result;
};

/**
 * 按课程分组并合并周次
 * @param {Array} schedules - 课程安排数组
 * @returns {Array} - 合并后的课程数组
 */
export const mergeScheduleWeeks = (schedules) => {
  const merged = {};

  schedules.forEach((schedule) => {
    // 生成唯一键 (包含课程名称和教师，以区分不同课程)
    const key = `${String(schedule.timeSlotId)}-${schedule.dayOfWeek}-${
      schedule.courseName
    }-${schedule.teacherName}`;

    if (!merged[key]) {
      merged[key] = {
        ...schedule,
        weeks: [...(schedule.weeks || [])],
      };
    } else {
      merged[key].weeks.push(...(schedule.weeks || []));
    }
  });

  const result = Object.values(merged).map((schedule) => ({
    ...schedule,
    weeks: [...new Set(schedule.weeks || [])].sort((a, b) => a - b),
  }));

  return result;
};
