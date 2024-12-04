const ScheduleTemplate = require("../models/ScheduleTemplate");
const asyncHandler = require("express-async-handler");

// @desc    获取所有模板
// @route   GET /api/schedule-templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await ScheduleTemplate.find({ school: req.user.school });
  res.json(templates);
});

// @desc    获取单个模板
// @route   GET /api/schedule-templates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await ScheduleTemplate.findOne({
    _id: req.params.id,
    school: req.user.school,
  });

  if (template) {
    res.json(template);
  } else {
    res.status(404);
    throw new Error("模板未找到");
  }
});

// @desc    创建新模板
// @route   POST /api/schedule-templates
// @access  Private/Admin
const createTemplate = asyncHandler(async (req, res) => {
  const { name, description, periods, isDefault } = req.body;

  const template = await ScheduleTemplate.create({
    name,
    description,
    periods,
    isDefault,
    createdBy: req.user._id,
    school: req.user.school,
  });

  res.status(201).json(template);
});

// @desc    更新模板
// @route   PUT /api/schedule-templates/:id
// @access  Private/Admin
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await ScheduleTemplate.findOne({
    _id: req.params.id,
    school: req.user.school,
  });

  if (template) {
    template.name = req.body.name || template.name;
    template.description = req.body.description || template.description;
    template.periods = req.body.periods || template.periods;
    template.isDefault = req.body.isDefault ?? template.isDefault;

    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } else {
    res.status(404);
    throw new Error("模板未找到");
  }
});

// @desc    删除模板
// @route   DELETE /api/schedule-templates/:id
// @access  Private/Admin
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await ScheduleTemplate.findOne({
    _id: req.params.id,
    school: req.user.school,
  });

  if (template) {
    if (template.isDefault) {
      res.status(400);
      throw new Error("不能删除默认模板");
    }
    await template.deleteOne();
    res.json({ message: "模板已删除" });
  } else {
    res.status(404);
    throw new Error("模板未找到");
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

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};
