export const TRACKS = {
  lightning_coder: { id: 'lightning_coder', label: 'Lightning Coder', labelCn: 'Lightning Coder 赛道', color: 'secondary', maxMembers: 2 },
  insighter: { id: 'insighter', label: 'Insighter', labelCn: 'Insighter 赛道', color: 'tertiary', maxMembers: 2 },
} as const;

export type TrackId = keyof typeof TRACKS;

// 最佳Skill奖 - 每个赛道评选3个，每人每赛道3票
export const BEST_DEMO_AWARDS = {
  best_lightning_coder: {
    id: 'best_lightning_coder',
    label: 'Best Skill - Lightning Coder',
    labelCn: '最佳 Skill - Lightning Coder 赛道',
    track: 'lightning_coder',
    maxVotes: 3,
    description: '评选最优秀的 Lightning Coder 项目（前3名获奖）',
    descriptionEn: 'Vote for the best Lightning Coder projects (Top 3 win)'
  },
  best_insighter: {
    id: 'best_insighter',
    label: 'Best Skill - Insighter',
    labelCn: '最佳 Skill - Insighter 赛道',
    track: 'insighter',
    maxVotes: 3,
    description: '评选最优秀的 Insighter 项目（前3名获奖）',
    descriptionEn: 'Vote for the best Insighter projects (Top 3 win)'
  },
} as const;

// 专项奖 - 共3个，不分赛道，每人每个奖选1个
export const SPECIAL_AWARDS = {
  special_brain: {
    id: 'special_brain',
    label: '🧠 Brain Blast Award',
    labelCn: '🧠 最脑洞Skill奖',
    track: null,
    maxVotes: 1,
    description: '选出1个你认为最有创意和想象力的项目',
    descriptionEn: 'Most creative and imaginative project'
  },
  special_infectious: {
    id: 'special_infectious',
    label: '🔥 Most Infectious Award',
    labelCn: '🔥 最感染力Skill奖',
    track: null,
    maxVotes: 1,
    description: '选出1个你认为现场展示效果最好、最有感染力的项目',
    descriptionEn: 'Most persuasive and inspiring presentation'
  },
  special_useful: {
    id: 'special_useful',
    label: '💎 Most Useful Award',
    labelCn: '💎 最实用Skill奖',
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

// ── 海选投票模块 ──────────────────────────────────────────────────────────────

export interface PrelimConfig {
  enabled: boolean;
  mode: 'A' | 'B';           // A = total pool; B = per-track
  totalRequired: number;      // Mode A: how many total
  optimizerRequired: number;  // Mode B: how many from optimizer (legacy key, kept for compat)
  builderRequired: number;    // Mode B: how many from builder (legacy key, kept for compat)
  notice: string;             // shown when disabled
  resultsRoles: string[];     // roles that can view results
}

export const PRELIM_CONFIG_KEYS = [
  'preliminary_enabled',
  'preliminary_mode',
  'preliminary_total',
  'preliminary_optimizer_count',
  'preliminary_builder_count',
  'preliminary_results_roles',
  'preliminary_notice',
] as const;

export const PRELIM_CONFIG_DEFAULTS: PrelimConfig = {
  enabled: false,
  mode: 'A',
  totalRequired: 30,
  optimizerRequired: 15,
  builderRequired: 15,
  notice: '海选投票暂未开始，敬请期待',
  resultsRoles: ['admin'],
};

export function parsePrelimConfig(configMap: Record<string, string>, userRole?: string): PrelimConfig & { canViewResults: boolean } {
  const enabled = configMap['preliminary_enabled'] === 'true';
  const mode = (configMap['preliminary_mode'] === 'B' ? 'B' : 'A') as 'A' | 'B';
  const totalRequired = parseInt(configMap['preliminary_total'] || '30', 10);
  const optimizerRequired = parseInt(configMap['preliminary_optimizer_count'] || '15', 10);
  const builderRequired = parseInt(configMap['preliminary_builder_count'] || '15', 10);
  const notice = configMap['preliminary_notice'] || PRELIM_CONFIG_DEFAULTS.notice;
  const resultsRoles = (configMap['preliminary_results_roles'] || 'admin').split(',').map(r => r.trim()).filter(Boolean);
  const canViewResults = userRole ? resultsRoles.includes(userRole) : false;
  return { enabled, mode, totalRequired, optimizerRequired, builderRequired, notice, resultsRoles, canViewResults };
}

// 参赛部门清单
export const DEPARTMENTS = [
  '增长算法',
  'Ushuaia',
  'Pevek',
  '国际化算法',
  '引擎架构',
  '生态算法',
  '国际化TnS',
  '平台算法二组',
  '推荐算法一组',
  '推荐算法二组',
  '推荐算法三组',
  '客服算法',
  '搜索算法',
  'Super Intelligence',
  '社区工程部',
  '社区战略组',
] as const;

export type Department = typeof DEPARTMENTS[number];
