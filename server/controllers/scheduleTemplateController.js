const ScheduleTemplate = require("../models/ScheduleTemplate");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// @desc    获取所有模板
// @route   GET /api/schedule-templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  try {
    const templates = await ScheduleTemplate.find({
      school: req.user.school,
    });
    res.json(templates);
  } catch (error) {
    console.error("获取模板列表失败:", error);
    res.status(500).json({ message: "获取模板列表失败" });
  }
});

// @desc    获取单个模板
// @route   GET /api/schedule-templates/:id
// @access  Private
const getTemplate = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID格式
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "无效的模板ID" });
    }

    const template = await ScheduleTemplate.findOne({
      _id: id,
      school: req.user.school,
    });

    if (!template) {
      return res.status(404).json({ message: "模板不存在" });
    }

    res.json(template);
  } catch (error) {
    console.error("获取模板失败:", error);
    res.status(500).json({ message: "获取模板失败" });
  }
});

// @desc    创建新模板
// @route   POST /api/schedule-templates
// @access  Private/Admin
const createTemplate = asyncHandler(async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      school: req.user.school,
      createdBy: req.user._id,
    };

    const template = await ScheduleTemplate.create(templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error("创建模板失败:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "创建模板失败: " + error.message,
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "创建模板失败" });
  }
});

// @desc    更新模板
// @route   PUT /api/schedule-templates/:id
// @access  Private/Admin
const updateTemplate = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID格式
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "无效的模板ID" });
    }

    const template = await ScheduleTemplate.findOneAndUpdate(
      {
        _id: id,
        school: req.user.school,
      },
      req.body,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "模板不存在" });
    }

    res.json(template);
  } catch (error) {
    console.error("更新模板失败:", error);
    res.status(500).json({ message: "更新模板失败" });
  }
});

// @desc    删除模板
// @route   DELETE /api/schedule-templates/:id
// @access  Private/Admin
const deleteTemplate = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID格式
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "无效的模板ID" });
    }

    const template = await ScheduleTemplate.findOne({
      _id: id,
      school: req.user.school,
    });

    if (!template) {
      return res.status(404).json({ message: "模板不存在" });
    }

    if (template.isActive) {
      return res.status(400).json({ message: "不能删除当前使用的模板" });
    }

    // 使用 deleteOne 方法删除模板
    await ScheduleTemplate.deleteOne({ _id: id });
    res.json({ message: "模板删除成功" });
  } catch (error) {
    console.error("删除模板失败:", error);
    res.status(500).json({ message: "删除模板失败" });
  }
});

// @desc    设置默认模板
// @route   PUT /api/schedule-templates/:id/default
// @access  Private/Admin
const setDefaultTemplate = asyncHandler(async (req, res) => {
  const template = await ScheduleTemplate.findOne({
    _id: req.params.id,
    school: req.user.school,
  });

  if (template) {
    template.isDefault = true;
    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } else {
    res.status(404);
    throw new Error("模板未找到");
  }
});

// 设置当前模板
const setActiveTemplate = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID格式
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "无效的模板ID" });
    }

    // 先将所有模板设置为非活动
    await ScheduleTemplate.updateMany(
      { school: req.user.school },
      { isActive: false }
    );

    // 将指定模板设置为活动
    const template = await ScheduleTemplate.findOneAndUpdate(
      {
        _id: id,
        school: req.user.school,
      },
      { isActive: true },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "模板不存在" });
    }

    res.json(template);
  } catch (error) {
    console.error("设置当前模板失败:", error);
    res.status(500).json({ message: "设置当前模板失败" });
  }
});

// 获取当前活动模板
const getCurrentTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await ScheduleTemplate.findOne({
      school: req.user.school,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({ message: "未找到当前活动模板" });
    }

    res.json(template);
  } catch (error) {
    console.error("获取当前活动模板失败:", error);
    res.status(500).json({ message: "获取当前活动模板失败" });
  }
});

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  setActiveTemplate,
  getCurrentTemplate,
};
