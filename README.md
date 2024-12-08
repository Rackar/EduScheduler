# EduScheduler (E 排课)

<p align="center">
  <img src="docs/images/Elogo.jpg" alt="EduScheduler Logo" width="200"/>
  <br>
  <i>智能教学排课系统</i>
  <br>
</p>

<p align="center">
  <a href="https://github.com/Rackar/eduscheduler/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Rackar/eduscheduler" alt="license">
  </a>
  <a href="https://github.com/Rackar/eduscheduler/stargazers">
    <img src="https://img.shields.io/github/stars/Rackar/eduscheduler" alt="stars">
  </a>
  <a href="https://github.com/Rackar/eduscheduler/network">
    <img src="https://img.shields.io/github/forks/Rackar/eduscheduler" alt="forks">
  </a>
  <a href="https://github.com/Rackar/eduscheduler/issues">
    <img src="https://img.shields.io/github/issues/Rackar/eduscheduler" alt="issues">
  </a>
</p>

<p align="center">
  <a href="#特别说明">特别说明</a> •
  <a href="#简介">简介</a> •
  <a href="#特性">特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#部署">部署</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#贡献">贡献</a> •
  <a href="#许可证">许可证</a>
</p>

## 特别说明

本项目还在**早期开发**中，设计和文档可能随时变动，请谨慎使用。

本项目开发过程大量使用了 Cursor 和 Claude 模型，特此感谢。

[演示系统地址](https://www.codingyang.com/edus) [《EduS 基本教程》](docs/guide.md)

## 简介

EduScheduler (E 排课) 是一个开源的智能教学排课系统，专为学校和教育机构设计。它能够自动生成符合各种教学需求和约束条件的课程表，大幅提高排课效率，降低人工排课的复杂度。

### 为什么选择 EduScheduler？

- 🚀 智能排课算法，自动生成最优课表
- 💻 现代化的 Web 界面，操作简单直观
- 🔧 灵活的约束配置，满足多样化需求
- 📊 丰富的数据统计和可视化功能
- 🔄 支持实时调整和冲突检测
- 🌐 支持多校区、多部门管理

## 特性

### 核心功能

- **智能排课**

  - 自动生成课表
  - 多维度约束配置
  - 实时冲突检测
  - 手动微调优化

- **数据管理**

  - 教师信息管理
  - 班级信息管理
  - 课程信息管理
  - 教室资源管理

- **课表视图**
  - 班级课表视图
  - 教师课表视图
  - 教室课表视图
  - 统计分析视图

### 高级特性

- 多学期管理
- 教师偏好设置
- 课程时间限制
- 教室资源分配
- 导入导出功能
- 操作日志记录

## 快速开始

### 环境要求

- Node.js 16+
- MongoDB 4.4+
- Redis (可选，用于会话存储)

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/Rackar/eduscheduler.git
cd eduscheduler
```

2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env.development
cp .env.example .env.production

# 开发环境编辑 .env.development 文件，配置必要的环境变量
# 生产环境编辑 .env.production 文件，配置必要的环境变量
# MONGODB_URI 请替换为您的 MongoDB 数据库连接字符串
# JWT_SECRET 请替换为您的 JWT 密钥
```

4. 启动开发服务器

```bash
# 启动后端服务
cd server
npm run dev

# 初始化超级管理员
npm run init:superadmin
# 默认用户名密码：superadmin/edus2024

# 启动前端服务
cd frontend
npm run dev
```

后端接口地址默认在 http://localhost:3000

浏览器访问 http://localhost:5173 即可看到应用界面。

## 部署

### 开源部署

1. 构建前端

```bash
cd frontend
npm run build
```

2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. 启动后端服务

```bash
cd server
npm run start
```

### SASS

未来项目成熟后，计划提供免部署 SASS 服务。

## 技术栈

### 前端

- Vue 3
- Vite
- Element Plus
- TailwindCSS

### 后端

- Node.js
- Express
- Mongoose
- JWT

## 贡献

欢迎任何形式的贡献，包括但不限于：

- 提交问题和建议
- 改进文档
- 修复 bug
- 添加新功能

## 许可证

本项目采用 [Apache License 2.0 许可证](LICENSE)。

## 赞助

如果您觉得这个项目对您有帮助，欢迎打赏赞助支持我的开发工作。

## 联系我

- 微信号: Sabercon

---

<p align="center">Made with ❤️ by Rackar</p>
