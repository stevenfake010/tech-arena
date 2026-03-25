export const TRACKS = {
  optimizer: { id: 'optimizer', label: 'Optimizer', labelCn: 'Optimizer 赛道', color: 'secondary', maxMembers: 1 },
  builder: { id: 'builder', label: 'Builder', labelCn: 'Builder 赛道', color: 'tertiary', maxMembers: 2 },
} as const;

export type TrackId = keyof typeof TRACKS;

// 最佳Demo奖 - 每个赛道评选3个，每人每赛道3票
export const BEST_DEMO_AWARDS = {
  best_optimizer: {
    id: 'best_optimizer',
    label: 'Best Demo - Optimizer',
    labelCn: '最佳 Demo - Optimizer 赛道',
    track: 'optimizer',
    maxVotes: 3,
    description: '评选最优秀的 Optimizer 项目（前3名获奖）',
    descriptionEn: 'Vote for the best Optimizer projects (Top 3 win)'
  },
  best_builder: {
    id: 'best_builder',
    label: 'Best Demo - Builder',
    labelCn: '最佳 Demo - Builder 赛道',
    track: 'builder',
    maxVotes: 3,
    description: '评选最优秀的 Builder 项目（前3名获奖）',
    descriptionEn: 'Vote for the best Builder projects (Top 3 win)'
  },
} as const;

// 专项奖 - 共3个，不分赛道，每人每个奖选1个
export const SPECIAL_AWARDS = {
  special_brain: { 
    id: 'special_brain', 
    label: '🧠 Brain Blast Award', 
    labelCn: '🧠 最脑洞Demo奖',
    track: null, 
    maxVotes: 1,
    description: '选出1个你认为最有创意和想象力的项目',
    descriptionEn: 'Most creative and imaginative project'
  },
  special_infectious: { 
    id: 'special_infectious', 
    label: '🔥 Most Infectious Award', 
    labelCn: '🔥 最感染力Demo奖',
    track: null, 
    maxVotes: 1,
    description: '选出1个你认为现场展示效果最好、最有感染力的项目',
    descriptionEn: 'Most persuasive and inspiring presentation'
  },
  special_useful: { 
    id: 'special_useful', 
    label: '💎 Most Useful Award', 
    labelCn: '💎 最实用Demo奖',
    track: null, 
    maxVotes: 1,
    description: '选出1个你认为最实用、最能助力日常工作的项目',
    descriptionEn: 'Most practical and problem-solving project'
  },
} as const;

// 合并所有投票类型（保持向后兼容）
export const VOTE_TYPES = {
  ...BEST_DEMO_AWARDS,
  ...SPECIAL_AWARDS,
} as const;

export type VoteTypeId = keyof typeof VOTE_TYPES;

export const PRO_JUDGE_WEIGHT = 2;
export const NORMAL_WEIGHT = 1;
