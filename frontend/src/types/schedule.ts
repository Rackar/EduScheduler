export interface TimeSlot {
  id: string;
  name: string; // 如"第一节"
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  creditHours: number; // 学时数，如 1
  linkedSlots?: string[]; // 关联时段的 ID，用于大课
}

export interface ScheduleTemplate {
  id: string;
  name: string; // 模板名称
  description?: string;
  periods: {
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  };
  isDefault?: boolean;
}
