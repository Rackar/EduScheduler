const ExchangeRequest = require("../models/ExchangeRequest");
const Course = require("../models/Course");

// 创建交换请求
exports.createExchangeRequest = async (req, res) => {
  try {
    const { givingCourseId, receivingCourseId, reason } = req.body;
    const requestingTeacher = req.user._id; // 假设通过认证中间件设置了 req.user

    const newRequest = await ExchangeRequest.create({
      requestingTeacher,
      givingCourse: givingCourseId,
      receivingCourse: receivingCourseId,
      reason,
    });

    await newRequest.populate(["givingCourse", "receivingCourse"]);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: "创建交换请求失败", error: error.message });
  }
};

// 获取所有交换请求
exports.getAllExchangeRequests = async (req, res) => {
  try {
    const requests = await ExchangeRequest.find()
      .populate("requestingTeacher", "username")
      .populate("givingCourse")
      .populate("receivingCourse");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "获取交换请求失败" });
  }
};

// 处理交换请求
exports.handleExchangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await ExchangeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "交换请求不存在" });
    }

    if (status === "approved") {
      // 交换课程的教师
      await Course.findByIdAndUpdate(request.givingCourse, {
        status: "pending_exchange",
      });
      await Course.findByIdAndUpdate(request.receivingCourse, {
        status: "pending_exchange",
      });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: "处理交换请求失败", error: error.message });
  }
};

// 获取教师的交换请求
exports.getTeacherExchangeRequests = async (req, res) => {
  try {
    const teacherId = req.user._id; // 假设通过认证中间件设置了 req.user
    const requests = await ExchangeRequest.find({
      requestingTeacher: teacherId,
    })
      .populate("givingCourse")
      .populate("receivingCourse");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "获取教师交换请求失败" });
  }
};
