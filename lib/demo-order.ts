/**
 * 路演顺序名单（与数据库中的 demo.name 保持完全一致）
 * guide page 和 leaderboard 均从此处导入，保证过滤一致性。
 *
 * 结构：[0..14] 正赛 · [15..17] 跨组展示
 */

export const OPTIMIZER_ORDER: string[] = [
  // 15 个正赛项目
  '投研助手-电子小林虾',
  'AI dashboard',
  '抖音新星捕捞器',
  '小红书上的男人在做什么',
  'AI research thinking partner',
  '"财报哨兵"：战略团队的 In-House Earnings Coverage — One Bot, Hundreds of Companies',
  'Podcast brief',
  '再也不想打开dayQ了',
  '搜索掘金searchinsights  (别名"搜索黄金矿工"）',
  '赛博秘书- 让Agent帮你管理任务',
  '问卷审核Skill',
  '用户onepage制作',
  'AI Daily Digest - 越跑越聪明的"AI今日头条"',
  '用研知识库LR',
  '【真实上线】-【小鹿AI】，长在HI里，Watch直连agent',
  // 校招生特别展示（已移除）
  // DI 优秀项目展示
  'AB实验分析AI化',
  '电商治理分析AI化',
  'Mio 广告AI诊断',
];

export const BUILDER_ORDER: string[] = [
  // 15 个正赛项目
  '【App真实上线可玩】Pensieve : Your Exclusive biographer',
  'Project Lumière',
  '麻将"作弊"器',
  'Soul Mirror',
  'Notes2Skill',
  '智能体笔记——小红书的第四种内容形式',
  'Expeditions | Your travel stories',
  '魔法薯🪄解密你的赛博八字',
  'ootd',
  '为你私藏的微光「角落」',
  '三张地图',
  'Tech Arena网站',
  '展览体温计 — 看展的真实评价，一眼可见',
  'Project Spark：点亮中低活用户的feed',
  '"懂你的好物推荐卡"',
  // 校招生特别展示（已移除）
  // 投研优秀项目展示
  '星盘',
  'Org Snowball',
  'People Finder',
];

/** Optimizer 入选 demo 名称集合（精确匹配用） */
export const OPTIMIZER_ELIGIBLE = new Set(OPTIMIZER_ORDER);

/** Builder 入选 demo 名称集合（精确匹配用） */
export const BUILDER_ELIGIBLE = new Set(BUILDER_ORDER);

/** 所有入选 demo 名称集合（特别奖项跨赛道使用） */
export const ALL_ELIGIBLE = new Set([...OPTIMIZER_ORDER, ...BUILDER_ORDER]);
