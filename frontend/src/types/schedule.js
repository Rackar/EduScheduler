/**
 * @typedef {Object} TimeSlot
 * @property {string} id
 * @property {string} name - 如"第一节"
 * @property {string} startTime - "08:00"
 * @property {string} endTime - "08:45"
 * @property {number} creditHours - 学时数，如 1
 * @property {string[]} [linkedSlots] - 关联时段的 ID，用于大课
 */

/**
 * @typedef {Object} ScheduleTemplate
 * @property {string} id
 * @property {string} name - 模板名称
 * @property {string} [description]
 * @property {Object} periods
 * @property {TimeSlot[]} periods.morning
 * @property {TimeSlot[]} periods.afternoon
 * @property {TimeSlot[]} periods.evening
 * @property {boolean} [isDefault]
 */
