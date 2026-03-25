-- 检查 votes 表的约束
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'votes'::regclass;

-- 检查是否有错误的唯一约束（只包含 voter_id 和 vote_type）
-- 如果有，需要删除并重建正确的约束

-- 正确的约束应该是 (voter_id, demo_id, vote_type)
-- 这个约束允许用户在不同奖项投多个项目，但不能重复投同一个项目

-- 如果需要修复，执行以下步骤：
-- 1. 删除错误的约束
-- ALTER TABLE votes DROP CONSTRAINT IF EXISTS 错误约束名;

-- 2. 添加正确的唯一索引
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON votes(voter_id, demo_id, vote_type);

-- 或者添加正确的唯一约束
-- ALTER TABLE votes ADD CONSTRAINT votes_unique_vote UNIQUE (voter_id, demo_id, vote_type);
