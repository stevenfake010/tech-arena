# AI Demo Day - 项目完成状态

## 已完成页面

### 1. Entry Portal (登录页) ✅
- 薯名自动补全（支持拼音搜索）
- 部门自动填充
- 登录后跳转到 Guide 页面

### 2. Guide (活动指南) ✅
- 活动状态徽章
- 活动背景介绍
- 参赛规则
- 时间线
- 场地信息

### 3. Gallery (项目展示) ✅
- 分屏布局：左侧项目列表，右侧详情
- Optimizer / Builder 两赛道分类（可折叠）
- 搜索功能
- 项目详情展示（背景、解决方案、链接、媒体）

### 4. Leaderboard (排行榜) ✅
- 两赛道分别展示
- 实时排名
- 投票按钮（已投票后禁用）
- 专业评委权重支持

### 5. Square (社区需求) ✅
- 发布需求/想法
- 消息列表
- 点赞功能

### 6. Submit Modal (提交表单) ✅
- 项目名称、简介
- 赛道选择（影响成员数）
- 成员信息（1-2人）
- 背景、解决方案
- 媒体上传

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/auth/users | GET | 获取用户列表 |
| /api/auth/login | POST | 登录 |
| /api/auth/me | GET | 获取当前用户 |
| /api/demos | GET/POST | 获取/创建 Demo |
| /api/demos/[id] | GET | 获取单个 Demo |
| /api/leaderboard | GET | 获取排行榜 |
| /api/votes | GET/POST/DELETE | 投票管理 |
| /api/messages | GET/POST | 消息管理 |
| /api/messages/[id]/upvote | POST | 点赞消息 |
| /api/upload | POST | 文件上传 |

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3)
- Material Symbols

## 运行方式

```bash
cd ai-demo-day
npm install
npm run dev
```

访问 http://localhost:3000

## 登录测试账号

从 users.json 中选择任意用户，例如：
- 恒宇 / 社区战略组
- 菲特 / 社区战略组（专业评委）
- 小明 / 技术战略组

## MVP 注意事项

1. **当前使用 SQLite** - 数据存储在本地文件，适合MVP演示
2. **文件上传** - 保存在本地 data/uploads 目录
3. **如需迁移到 Supabase**：
   - 替换 `lib/db.ts` 为 Supabase 客户端
   - 更新所有 API 路由中的数据库查询
   - 文件上传改为 Supabase Storage

## 后续可优化项

1. 响应式设计（当前仅桌面端优化）
2. 图片懒加载
3. 投票实时同步（WebSocket）
4. 消息评论功能
5. 用户头像上传
6. 搜索高亮
7. 分页加载
