export const TRACKS = {
  optimizer: { id: 'optimizer', label: 'Optimizer', labelCn: 'Optimizer 赛道', color: 'secondary', maxMembers: 1 },
  builder: { id: 'builder', label: 'Builder', labelCn: 'Builder 赛道', color: 'tertiary', maxMembers: 2 },
} as const;

export type TrackId = keyof typeof TRACKS;

export const VOTE_TYPES = {
  best_optimizer: { id: 'best_optimizer', label: 'Best Demo - Optimizer', track: 'optimizer', maxVotes: 2 },
  best_builder: { id: 'best_builder', label: 'Best Demo - Builder', track: 'builder', maxVotes: 2 },
  special_brain: { id: 'special_brain', label: '脑洞大开奖', track: null, maxVotes: 1 },
  special_infectious: { id: 'special_infectious', label: '最佳感染力奖', track: null, maxVotes: 1 },
  special_useful: { id: 'special_useful', label: '最有用奖', track: null, maxVotes: 1 },
} as const;

export type VoteTypeId = keyof typeof VOTE_TYPES;

export const PRO_JUDGE_WEIGHT = 2;
export const NORMAL_WEIGHT = 1;
