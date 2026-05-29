# 邻里 H5 - 社区养老服务

> 基于 Vue3 + Node.js + SQLite 的本地部署版社区养老服务平台

## 🚀 快速启动

### 1. 启动后端服务

```bash
cd backend
npm install        # 首次运行需要安装依赖
npm run dev       # 启动后端服务
```

后端启动后运行在：**http://localhost:3000**

**首次启动会自动初始化假数据**（10个岗位、10个用户等）

### 2. 启动前端开发服务器

```bash
cd frontend
npm install        # 首次运行需要安装依赖
npm run dev       # 启动前端开发服务器
```

前端启动后运行在：**http://localhost:8080**

### 3. 访问应用

在浏览器打开：**http://localhost:8080**

## 🔑 测试账号

- **验证码（Mock）**: `123456`
- **手机号**:
  - 服务者：`13800000001` ~ `13800000005`
  - 用工方：`13900000001` ~ `13900000005`
- 任意手机号也可注册新账号

## 📁 项目结构

```
linli/
├── backend/              # Node.js + Express 后端
│   ├── app.js           # 服务入口
│   ├── routes/         # API 路由
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── db/             # 数据库（含假数据脚本）
│   └── socket/          # WebSocket
│
├── frontend/             # Vue3 前端
│   ├── src/
│   │   ├── views/      # 页面组件
│   │   ├── api/        # API 请求
│   │   ├── stores/     # 状态管理
│   │   └── router/     # 路由配置
│   └── dist/           # 生产构建
│
└── doc/                # 开发文档
```

## 🎯 功能模块

| 角色 | 功能 |
|------|------|
| **首页（岗位广场）** | 附近任务列表、地图模式、筛选排序、百度地图集成 |
| **服务者** | 认证申请、抢单接单、任务管理、钱包提现 |
| **用工方** | 发布任务、服务者广场、订单管理 |
| **通用** | 消息聊天、培训课程、银发圈社区 |

## 🗺️ V1.1 新功能

- **首页岗位广场**：基于地理位置展示附近5公里内任务
- **百度地图集成**：列表/地图双模式切换
- **筛选排序**：按距离、报酬、体力等级筛选
- **假数据初始化**：首次启动自动创建10个测试任务
- **身份选择后置**：先浏览任务，登录后再选择身份

## 🔧 技术栈

- **前端**: Vue 3 + Element Plus + Axios + Vite + Pinia + 百度地图
- **后端**: Node.js + Express 5.x + SQLite 3 + Socket.IO
- **认证**: JWT + 手机验证码（本地 Mock）

## 📡 API 基础路径

- 开发环境: `http://localhost:3000/api`
- WebSocket: `http://localhost:3000`

### 新增接口（V1.1）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks/nearby` | 获取附近岗位列表 |
| GET | `/api/tasks/public/:id` | 公开岗位详情 |
| POST | `/api/tasks/:id/grab` | 抢单接任务 |
| GET | `/api/location/convert` | 坐标转换（WGS-84→BD-09） |
| GET | `/api/location/distance` | 计算两点距离 |

## ⚠️ 注意事项

1. 本项目为本地部署版，无需上线即可使用
2. 验证码固定为 `123456`（Mock）
3. 数据库文件位于 `backend/data/linli.db`
4. 用户上传文件位于 `backend/uploads/`
5. 百度地图AK为演示用，如需上线请替换为您的AK

## 🛠️ 生产构建

```bash
cd frontend
npm run build   # 构建生产版本到 dist/ 目录
```

## 📝 开发文档

详细开发文档请查看：
- [doc/开发文档.md](./doc/开发文档.md)
- [doc/v1.1迭代.md](./doc/v1.1迭代.md)