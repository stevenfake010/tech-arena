import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// 测试项目数据
const TEST_DEMOS = {
  optimizer: [
    { name: 'AI 文档助手', summary: '自动整理会议纪要和文档摘要' },
    { name: '智能日程规划器', summary: '基于工作习惯的智能日程安排' },
    { name: '数据分析自动化', summary: '一键生成数据报告和可视化' },
    { name: '邮件智能回复', summary: '根据上下文自动生成邮件回复' },
    { name: '代码审查助手', summary: 'AI 辅助代码审查和建议' },
    { name: '会议纪要生成器', summary: '语音转文字并自动生成纪要' },
    { name: '任务优先级排序', summary: '基于紧急重要度的智能排序' },
    { name: '知识库检索助手', summary: '快速定位内部文档和资料' },
    { name: 'PPT 自动生成', summary: '根据大纲自动生成演示文稿' },
    { name: '翻译助手 Pro', summary: '专业术语-aware 的翻译工具' },
  ],
  builder: [
    { name: 'RedBook AI 创作平台', summary: '一站式内容创作和发布平台' },
    { name: '用户画像分析系统', summary: '深度用户行为分析和画像构建' },
    { name: '竞品监控雷达', summary: '实时追踪竞品动态和趋势' },
    { name: '社区氛围检测', summary: 'AI 识别社区负面情绪和风险' },
    { name: '内容推荐引擎', summary: '个性化内容推荐算法' },
    { name: '达人合作平台', summary: '连接品牌和创作者的平台' },
    { name: '直播数据分析', summary: '直播效果实时监测和优化' },
    { name: '商品趋势预测', summary: '基于数据的爆品预测' },
    { name: '用户流失预警', summary: '预测用户流失风险并干预' },
    { name: '智能客服系统', summary: '7x24 小时 AI 客服' },
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
      .eq('role', 'normal');

    if (userError || !communityUsers || communityUsers.length === 0) {
      return NextResponse.json({ error: '没有找到社区战略组的普通成员，请先创建用户' }, { status: 400 });
    }

    // 2. 生成 Optimizer 项目 - 随机分配给社区战略组成员
    for (let i = 0; i < TEST_DEMOS.optimizer.length; i++) {
      const demo = TEST_DEMOS.optimizer[i];
      // 随机选择一个提交者
      const submitter = communityUsers[Math.floor(Math.random() * communityUsers.length)];
      
      const { error } = await supabase.from('demos').insert({
        name: demo.name,
        summary: demo.summary,
        track: 'optimizer',
        demo_link: `https://demo${i + 1}.example.com`,
        submitter1_name: submitter.name,
        submitter1_dept: submitter.department,
        background: `这是 ${demo.name} 的背景描述。我们发现团队中很多人在工作中遇到了效率问题，因此开发了这个工具来解决痛点。`,
        media_urls: [],
        submitted_by: submitter.id,
      });

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
      
      const { error } = await supabase.from('demos').insert({
        name: demo.name,
        summary: demo.summary,
        track: 'builder',
        demo_link: `https://demo${i + 11}.example.com`,
        submitter1_name: submitter1.name,
        submitter1_dept: submitter1.department,
        submitter2_name: submitter2?.name || null,
        submitter2_dept: submitter2?.department || null,
        background: `这是 ${demo.name} 的项目背景。基于对市场的深度调研，我们发现这个领域有很大的机会。`,
        media_urls: [],
        submitted_by: submitter1.id,
      });

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
      
      const { error } = await supabase.from('messages').insert({
        author_id: author.id,
        title: msg.title,
        content: msg.content,
        category: null,
      });

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
