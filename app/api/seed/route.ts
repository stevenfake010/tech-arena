import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// 测试项目数据 - 包含 Why 和 How 的完整结构
const TEST_DEMOS = {
  optimizer: [
    { name: 'AI 文档助手', summary: '自动整理会议纪要和文档摘要', why: '团队成员每天花费大量时间整理会议纪要，效率低下且容易遗漏关键信息。', how: '基于大语言模型开发文档助手，自动提取会议录音中的关键决策、行动项和负责人，生成结构化纪要。', keywords: '会议纪要、语音识别、NLP、自动化、文档处理' },
    { name: '智能日程规划器', summary: '基于工作习惯的智能日程安排', why: '手动安排日程耗时且难以优化，经常出现会议冲突或深度工作时间被碎片化。', how: '分析用户历史日程数据和工作习惯，使用 AI 算法自动推荐最优日程安排，智能规避冲突。', keywords: '时间管理、日历、智能推荐、效率工具、工作流' },
    { name: '数据分析自动化', summary: '一键生成数据报告和可视化', why: '数据分析师重复制作相似报表，浪费大量时间在数据清洗和图表美化上。', how: '搭建自动化数据管道，用户只需选择数据源和报告类型，系统自动生成包含洞察的数据可视化报告。', keywords: '数据分析、可视化、自动化、BI、报表' },
    { name: '邮件智能回复', summary: '根据上下文自动生成邮件回复', why: '每天处理大量邮件占用大量时间，很多是重复类型的询问或确认。', how: '基于邮件上下文和历史回复习惯，使用 GPT 模型生成专业、个性化的邮件回复建议。', keywords: '邮件、GPT、智能回复、效率、办公自动化' },
    { name: '代码审查助手', summary: 'AI 辅助代码审查和建议', why: '人工代码审查耗时且容易遗漏潜在问题，新人缺乏审查经验。', how: '集成静态代码分析和 LLM，自动检测代码异味、安全漏洞，并给出优化建议和最佳实践。', keywords: '代码审查、LLM、静态分析、开发工具、质量保证' },
    { name: '会议纪要生成器', summary: '语音转文字并自动生成纪要', why: '会议记录需要专人负责，且实时记录容易遗漏讨论要点。', how: '实时语音识别转录会议内容，AI 自动提炼决策点、行动项，会后秒级生成完整纪要。', keywords: '语音识别、会议纪要、实时转录、NLP、效率' },
    { name: '任务优先级排序', summary: '基于紧急重要度的智能排序', why: '待办事项越来越多，难以判断优先级，经常错过重要 deadline。', how: '结合任务属性、截止日期、依赖关系，使用算法计算优先级分数，智能推荐每日工作顺序。', keywords: '任务管理、优先级、时间管理、智能推荐、GTD' },
    { name: '知识库检索助手', summary: '快速定位内部文档和资料', why: '公司内部文档分散各处，搜索效率低，经常找不到需要的信息。', how: '构建统一知识图谱，使用语义搜索替代关键词匹配，支持自然语言问答式检索。', keywords: '知识管理、语义搜索、知识图谱、RAG、企业搜索' },
    { name: 'PPT 自动生成', summary: '根据大纲自动生成演示文稿', why: '制作 PPT 占用大量时间，排版美化繁琐，内容逻辑组织困难。', how: '输入大纲或文档，AI 自动设计版式、匹配配图、优化排版，生成专业美观的演示文稿。', keywords: 'PPT、演示文稿、自动生成、设计、办公效率' },
    { name: '翻译助手 Pro', summary: '专业术语-aware 的翻译工具', why: '通用翻译工具对小众领域术语翻译不准确，需要大量人工校对。', how: '基于领域术语库微调翻译模型，支持上下文感知和专业术语一致性保障。', keywords: '翻译、NLP、术语库、本地化、多语言' },
  ],
  builder: [
    { name: 'RedBook AI 创作平台', summary: '一站式内容创作和发布平台', why: '创作者从选题到发布需要切换多个工具，流程繁琐，数据分散。', how: '集成 AI 选题、文案生成、图片创作、一键发布到小红书，打造 All-in-One 创作工作流。', keywords: '内容创作、AIGC、小红书、创作者工具、发布平台' },
    { name: '用户画像分析系统', summary: '深度用户行为分析和画像构建', why: '用户研究团队需要更精准、实时的用户洞察来支持产品决策。', how: '整合多源用户行为数据，使用机器学习构建动态用户画像，提供可视化洞察仪表盘。', keywords: '用户画像、数据分析、机器学习、可视化、用户研究' },
    { name: '竞品监控雷达', summary: '实时追踪竞品动态和趋势', why: '竞品信息分散在各平台，人工收集效率低，难以发现早期趋势信号。', how: '自动化抓取竞品公开数据，AI 识别产品更新和策略变化，生成竞品情报日报。', keywords: '竞品分析、情报、监控、数据分析、市场研究' },
    { name: '社区氛围检测', summary: 'AI 识别社区负面情绪和风险', why: '社区规模大后，负面内容和风险事件难以及时发现和干预。', how: '实时分析社区内容和互动，NLP 模型识别负面情绪和潜在风险，自动预警和推荐处理策略。', keywords: '内容安全、NLP、情感分析、社区治理、风控' },
    { name: '内容推荐引擎', summary: '个性化内容推荐算法', why: '用户反馈内容发现困难，希望看到更多符合兴趣的个性化推荐。', how: '基于用户行为序列和多模态内容理解，构建实时个性化推荐系统，提升内容分发效率。', keywords: '推荐系统、个性化、机器学习、算法、内容分发' },
    { name: '达人合作平台', summary: '连接品牌和创作者的平台', why: '品牌找达人合作流程繁琐，达人接商单缺乏透明机制，双方匹配效率低。', how: '构建达人画像和品牌需求匹配系统，提供从建联、谈判到履约的全流程数字化工具。', keywords: '达人营销、撮合平台、CRM、B2B、创作者经济' },
    { name: '直播数据分析', summary: '直播效果实时监测和优化', why: '直播运营依赖经验判断，缺乏实时数据反馈和优化建议。', how: '实时采集直播数据，AI 分析观众互动和内容效果，给出实时运营优化建议。', keywords: '直播、实时数据、运营工具、数据分析、电商' },
    { name: '商品趋势预测', summary: '基于数据的爆品预测', why: '选品依赖直觉和经验，爆品成功率低，错过最佳入场时机。', how: '整合市场搜索、社交讨论、供应链数据，使用时间序列模型预测商品趋势和潜力。', keywords: '趋势预测、时间序列、选品、电商、数据挖掘' },
    { name: '用户流失预警', summary: '预测用户流失风险并干预', why: '用户流失后才被动挽回，成本高效果差，需要提前识别风险用户。', how: '构建用户流失预测模型，识别高风险用户并触发个性化干预策略，降低流失率。', keywords: '用户留存、预测模型、机器学习、用户运营、增长' },
    { name: '智能客服系统', summary: '7x24 小时 AI 客服', why: '人工客服成本高、响应慢，夜间和节假日服务覆盖不足。', how: '基于大模型的智能客服系统，支持多轮对话和复杂问题处理，无缝转接人工。', keywords: '智能客服、大模型、对话系统、服务自动化、NLP' },
  ],
};

// 测试留言数据
const TEST_MESSAGES = [
  { title: '寻找前端开发合伙人', content: '我有一个关于内容创作者工具的想法，寻找一位有 React 经验的前端开发同学一起搞事情。有兴趣的私聊我！' },
  { title: '求助：推荐好用的数据可视化库', content: '项目中需要做复杂的数据图表，大家有什么推荐的库吗？ECharts、D3、AntV 哪个更好用？' },
  { title: '招募用户研究志愿者', content: '我们正在做一个新功能，需要找 5-10 位同学做用户访谈，大约 30 分钟，有小礼物相送~' },
  { title: '分享一个很好用的 AI 提示词技巧', content: '最近发现用 "Let\'s think step by step" 能显著提升 GPT 的推理能力，大家可以试试！' },
  { title: '求租：需要一个设计师帮忙做 PPT', content: 'Demo Day 的 PPT 需要做美化，有没有设计师同学愿意帮忙？可以有偿！' },
  { title: '技术求助：Supabase 连接问题', content: '本地开发时经常遇到连接超时，大家有遇到过吗？怎么解决的？' },
  { title: '招募后端开发', content: 'Builder 赛道项目找一位后端同学，技术栈是 Node.js + PostgreSQL，感兴趣的联系我。' },
  { title: '分享：产品需求文档模板', content: '整理了一个我们团队在用的 PRD 模板，觉得还挺实用的，共享给大家参考。' },
];

// 随机打乱数组
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function POST() {
  const supabase = getSupabaseAdmin();
  const results = {
    demos: { optimizer: 0, builder: 0, total: 0 },
    messages: 0,
    errors: [] as string[],
  };

  try {
    // 1. 获取社区战略组的普通成员（排除 HR 和评委）
    const { data: communityUsers, error: userError } = await supabase
      .from('users')
      .select('id, name, department')
      .eq('department', '社区战略组')
      .eq('role', 'normal') as { data: any[]; error: any };

    if (userError || !communityUsers || communityUsers.length === 0) {
      return NextResponse.json({ error: '没有找到社区战略组的普通成员，请先创建用户' }, { status: 400 });
    }

    // 2. 生成 Optimizer 项目 - 随机分配给社区战略组成员
    for (let i = 0; i < TEST_DEMOS.optimizer.length; i++) {
      const demo = TEST_DEMOS.optimizer[i];
      // 随机选择一个提交者
      const submitter = communityUsers[Math.floor(Math.random() * communityUsers.length)];
      
      const demoData: any = {
        name: demo.name,
        summary: demo.summary,
        track: 'optimizer',
        demo_link: `https://demo${i + 1}.example.com`,
        submitter1_name: submitter.name,
        submitter1_dept: submitter.department,
        background: demo.why,
        solution: demo.how,
        keywords: demo.keywords,
        media_urls: [],
        submitted_by: submitter.id,
      };
      const { error } = await supabase.from('demos').insert(demoData);

      if (error) {
        results.errors.push(`Optimizer ${demo.name}: ${error.message}`);
      } else {
        results.demos.optimizer++;
        results.demos.total++;
      }
    }

    // 3. 生成 Builder 项目 - 随机分配给社区战略组成员（可能组队）
    for (let i = 0; i < TEST_DEMOS.builder.length; i++) {
      const demo = TEST_DEMOS.builder[i];
      // 随机选择主提交者
      const submitter1 = communityUsers[Math.floor(Math.random() * communityUsers.length)];
      // 随机决定是否组队（50% 概率）
      const hasPartner = Math.random() > 0.5;
      let submitter2 = null;
      if (hasPartner) {
        // 选择不同的伙伴
        const otherUsers = communityUsers.filter(u => u.id !== submitter1.id);
        submitter2 = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      }
      
      const demoData: any = {
        name: demo.name,
        summary: demo.summary,
        track: 'builder',
        demo_link: `https://demo${i + 11}.example.com`,
        submitter1_name: submitter1.name,
        submitter1_dept: submitter1.department,
        submitter2_name: submitter2?.name || null,
        submitter2_dept: submitter2?.department || null,
        background: demo.why,
        solution: demo.how,
        keywords: demo.keywords,
        media_urls: [],
        submitted_by: submitter1.id,
      };
      const { error } = await supabase.from('demos').insert(demoData);

      if (error) {
        results.errors.push(`Builder ${demo.name}: ${error.message}`);
      } else {
        results.demos.builder++;
        results.demos.total++;
      }
    }

    // 4. 生成测试留言 - 也随机分配给社区战略组成员
    const shuffledMessages = shuffle(TEST_MESSAGES);
    for (let i = 0; i < shuffledMessages.length; i++) {
      const msg = shuffledMessages[i];
      // 随机选择作者
      const author = communityUsers[Math.floor(Math.random() * communityUsers.length)];
      
      const messageData: any = {
        author_id: author.id,
        title: msg.title,
        content: msg.content,
        category: null,
      };
      const { error } = await supabase.from('messages').insert(messageData);

      if (error) {
        results.errors.push(`Message: ${error.message}`);
      } else {
        results.messages++;
      }
    }

    // 获取使用的作者列表
    const usedAuthors = new Set<string>();
    for (let i = 0; i < results.demos.total; i++) {
      // 简化处理，直接列出所有可能的社区战略组成员
    }

    return NextResponse.json({
      success: true,
      message: `测试数据生成完成！创建了 ${results.demos.total} 个项目（${results.demos.optimizer} 个 Optimizer，${results.demos.builder} 个 Builder）和 ${results.messages} 条留言。所有作者均为社区战略组普通成员（已排除 HR 和评委）。`,
      results,
      authors: communityUsers.map(u => u.name),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
