const TimeSlot = require("../models/TimeSlot");

// 获取所有时间段
exports.getAllTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find().sort("order");
    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: "获取时间段失败" });
  }
};

// 创建新时间段
exports.createTimeSlot = async (req, res) => {
  try {
    const { name, startTime, endTime, type, order, breakTime } = req.body;

    // 验证时间格式
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res
        .status(400)
        .json({ message: "时间格式无效，请使用 HH:mm 格式" });
    }

    const newTimeSlot = new TimeSlot({
      name,
      startTime,
      endTime,
      type,
      order,
      breakTime,
    });

    await newTimeSlot.save();
    res.status(201).json(newTimeSlot);
  } catch (error) {
    res.status(400).json({ message: "创建时间段失败", error: error.message });
  }
};

// 批量创建默认时间段
exports.createDefaultTimeSlots = async (req, res) => {
  try {
    const defaultTimeSlots = [
      {
        name: "第一节",
        startTime: "08:00",
        endTime: "08:45",
        type: "morning",
        order: 1,
        breakTime: { duration: 10 },
      },
      {
        name: "第二节",
        startTime: "08:55",
        endTime: "09:40",
        type: "morning",
        order: 2,
        breakTime: { duration: 20, isLongBreak: true },
      },
      {
        name: "第三节",
        startTime: "10:00",
        endTime: "10:45",
        type: "morning",
        order: 3,
        breakTime: { duration: 10 },
      },
      {
        name: "第四节",
        startTime: "10:55",
        endTime: "11:40",
        type: "morning",
        order: 4,
        breakTime: { duration: 120 }, // 午休时间
      },
      {
        name: "第五节",
        startTime: "13:40",
        endTime: "14:25",
        type: "afternoon",
        order: 5,
        breakTime: { duration: 10 },
      },
      {
        name: "第六节",
        startTime: "14:35",
        endTime: "15:20",
        type: "afternoon",
        order: 6,
        breakTime: { duration: 20, isLongBreak: true },
      },
      {
        name: "第七节",
        startTime: "15:40",
        endTime: "16:25",
        type: "afternoon",
        order: 7,
        breakTime: { duration: 10 },
      },
      {
        name: "第八节",
        startTime: "16:35",
        endTime: "17:20",
        type: "afternoon",
        order: 8,
      },
    ];

    await TimeSlot.insertMany(defaultTimeSlots);
    res.status(201).json({ message: "默认时间段创建成功" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "创建默认时间段失败", error: error.message });
  }
};

// 更新时间段
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updatedTimeSlot);
  } catch (error) {
    res.status(400).json({ message: "更新时间段失败" });
  }
};

// 删除时间段
exports.deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    await TimeSlot.findByIdAndDelete(id);
    res.json({ message: "时间段已删除" });
  } catch (error) {
    res.status(500).json({ message: "删除时间段失败" });
  }
};
