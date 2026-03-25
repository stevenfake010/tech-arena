-- 检查 votes 表的 vote_type 列类型
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'votes' 
    AND column_name = 'vote_type';

-- 如果是枚举类型，查看枚举值
SELECT 
    e.enumlabel
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE 
    t.typname = (
        SELECT udt_name FROM information_schema.columns 
        WHERE table_name = 'votes' AND column_name = 'vote_type'
    );

-- 检查现有投票中的 vote_type 值
SELECT vote_type, COUNT(*) as count FROM votes GROUP BY vote_type;
