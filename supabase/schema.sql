-- Supabase 数据库表结构
-- 在 Supabase Dashboard -> SQL Editor -> New query 中执行

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demo 项目表
CREATE TABLE IF NOT EXISTS demos (
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

-- 投票表
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER NOT NULL REFERENCES users(id),
  demo_id INTEGER NOT NULL REFERENCES demos(id),
  vote_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, demo_id, vote_type)
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消息点赞表
CREATE TABLE IF NOT EXISTS message_upvotes (
  message_id INTEGER NOT NULL REFERENCES messages(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (message_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_votes_vote_type ON votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_demos_track ON demos(track);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_id);

-- 初始化用户数据（从 users.json 导入）
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
  ('陈七', '用户研究组', 'normal')
ON CONFLICT (name) DO NOTHING;

-- 创建存储 bucket 用于文件上传
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储权限
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');
