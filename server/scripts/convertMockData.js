const fs = require("fs");
const path = require("path");

/**
 * 转换 ID 格式
 * @param {Object} obj - 需要转换的对象
 * @returns {Object} - 转换后的对象
 */
const convertIds = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  // 如果是数组，递归处理每个元素
  if (Array.isArray(obj)) {
    return obj.map((item) => convertIds(item));
  }

  // 创建新对象，避免修改原对象
  const converted = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "$oid") {
      // 直接返回 ID 字符串
      return value;
    } else if (key === "$date") {
      // 转换日期格式
      return new Date(value).toISOString();
    } else if (value && typeof value === "object") {
      if (key === "_id") {
        // 处理 _id 字段
        converted[key] = value.$oid;
      } else {
        // 递归处理嵌套对象
        converted[key] = convertIds(value);
      }
    } else {
      // 保持其他字段不变
      converted[key] = value;
    }
  }

  return converted;
};

/**
 * 转换文件
 * @param {string} fileName - 文件名
 */
const convertFile = (fileName) => {
  const filePath = path.join(__dirname, "../mock", fileName);

  try {
    // 读取文件
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // 转换数据
    const converted = convertIds(data);

    // 写入新文件
    const newFilePath = path.join(
      __dirname,
      "../mock",
      `converted_${fileName}`
    );
    fs.writeFileSync(newFilePath, JSON.stringify(converted, null, 2), "utf8");

    console.log(`✅ 成功转换文件: ${fileName}`);
  } catch (error) {
    console.error(`❌ 转换文件失败 ${fileName}:`, error);
  }
};

// 需要转换的文件列表
const files = [
  "course.json",
  "users.json",
  "class.json",
  "scheduletemplates.json",
  // ... 其他需要转换的文件
];

// 执行转换
console.log("开始转换 mock 数据...");
files.forEach(convertFile);
console.log("转换完成!");
