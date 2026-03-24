# Supabase 设置指南

## 已完成的迁移

✅ 所有 API 已从 SQLite 迁移到 Supabase
✅ 文件上传使用 Supabase Storage

## 你需要做的步骤

### 1. 创建数据库表

登录 [Supabase Dashboard](https://app.supabase.io) -> 你的项目 -> **SQL Editor** -> **New query**

复制粘贴 `supabase/schema.sql` 中的内容并执行。

或者手动执行以下关键步骤：

```sql
-- 1. 创建用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 demos 表
CREATE TABLE demos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('optimizer', 'builder')),
  demo_link TEXT,
  submitter1_name TEXT NOT NULL,
  submitter1_dept TEXT NOT NULL,
  submitter2_name TEXT,
  submitter2_dept TEXT,
  background TEXT,
  solution TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 votes 表
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER NOT NULL REFERENCES users(id),
  demo_id INTEGER NOT NULL REFERENCES demos(id),
  vote_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, demo_id, vote_type)
);

-- 4. 创建 messages 表
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 message_upvotes 表
CREATE TABLE message_upvotes (
  message_id INTEGER NOT NULL REFERENCES messages(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (message_id, user_id)
);

-- 6. 插入初始用户数据
INSERT INTO users (name, department, role) VALUES
  ('恒宇', '社区战略组', 'normal'),
  ('菲特', '社区战略组', 'pro_judge'),
  ('小明', '技术战略组', 'normal'),
  ('小红', '内容策略组', 'normal'),
  ('小华', '投资分析组', 'normal'),
  ('张三', '社区战略组', 'normal'),
  ('李四', '技术战略组', 'normal'),
  ('王五', '内容策略组', 'normal'),
  ('赵六', '投资分析组', 'normal'),
  ('陈七', '用户研究组', 'normal');
```

### 2. 创建 Storage Bucket

1. 进入 **Storage** 页面
2. 点击 **New bucket**
3. 名称填 `uploads`
4. 勾选 **Public bucket**（让上传的文件可以被公开访问）
5. 创建

### 3. 设置 Storage 权限

进入 Storage -> uploads bucket -> **Policies**:

添加以下策略：

**SELECT 策略**（允许公开读取）:
- Name: `Allow public read access`
- Allowed operation: `SELECT`
- Target roles: `anon`, `authenticated`
- Policy definition: `true`

**INSERT 策略**（允许登录用户上传）:
- Name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition: `true`

### 4. 运行项目

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

如果使用 Vercel 部署，需要设置环境变量：

1. **NEXT_PUBLIC_SUPABASE_URL**: `your_supabase_url`
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: `your_anon_key`
3. **SUPABASE_SERVICE_ROLE_KEY**: `your_service_role_key`

## 注意事项

- **Service Role Key** 是服务端密钥，不要暴露给客户端
- 生产环境建议启用 RLS (Row Level Security)
- 文件上传大小限制可以在 Supabase 设置中调整
