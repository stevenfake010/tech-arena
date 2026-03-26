// 语言配置 - 暂时只支持中文，简化资源加载
export type Language = 'zh';

export const translations = {
  zh: {
    // 导航
    nav: {
      guide: '指南',
      gallery: 'Demo总览',
      leaderboard: 'Demo投票',
      square: '留言广场',
      myDemos: '我的Demo',
      submit: '提交 Demo',
      login: '登录',
      guest: '游客',
      admin: '管理后台',
    },
    // 登录页
    login: {
      title: 'AI Demo Day',
      subtitle: '小红书战略 / 投资 / 用户研究',
      registration: '登录',
      description: '请输入你的薯名和部门',
      nameLabel: '薯名',
      namePlaceholder: '请输入薯名',
      deptLabel: '部门',
      deptPlaceholder: '选择薯名后自动填充',
      submit: '进入',
      submitting: '登录中...',
      guestEntry: '👀 以游客身份浏览',
      errorNoUser: '请选择你的薯名',
      errorNetwork: '网络错误，请重试',
      notFound: '未找到匹配用户',
    },
    // Guide 页
    guide: {
      badge: '2025 春季',
      title: 'Evolution: AI Demo Day',
      subtitle: '战略、研究与投资专场',
      status: '报名进行中',
      whyTitle: '为什么叫 Evolution？',
      whyContent1: '别再谈论未来了。开始交付它。',
      whyContent2: 'AI Native 时代不是即将到来，而是已经到来。它正在重写我们思考、工作和创造的方式。作为小红书的"大脑"——战略、用户研究和投资者——我们不只是在这里预测未来，我们在这里构建它。',
      whatTitle: '这是什么？',
      whatContent: 'AI Demo Day 是一个内部创新展示平台。无论你是用 AI 提效（Optimizer），还是在构建 AI 产品（Builder），这里都是展示你 Evolution 的舞台。',
      categories: {
        optimizer: {
          title: '⚡️ Optimizer',
          desc: '用 AI 提升工作效率的个体',
        },
        builder: {
          title: '🛠️ Builder',
          desc: '构建 AI 产品的团队',
        },
      },
    },
    // Gallery 页
    gallery: {
      title: '作品展示',
      subtitle: '探索所有提交的 Demo 项目',
      search: '搜索项目...',
      optimizer: 'Optimizer 赛道',
      builder: 'Builder 赛道',
      noResults: '没有找到匹配的项目',
      items: '个项目',
      viewDemo: '查看演示',
      trackLabel: '赛道',
      teamLabel: '团队',
      backgroundLabel: '背景',
      pitchLabel: '一句话介绍',
    },
    // Square 页
    square: {
      title: '广场',
      subtitle: '寻找合伙人、分享想法、交流讨论',
      placeholder: '分享你的想法、寻找合伙人、提问...',
      post: '发布',
      posting: '发布中...',
      empty: '暂无留言，来抢沙发吧！',
      upvote: '点赞',
    },
    // Leaderboard 页
    leaderboard: {
      title: '排行榜',
      subtitle: '实时投票结果',
      myVotes: '我的投票',
      optimizerAward: '最佳 Optimizer',
      builderAward: '最佳 Builder',
      vote: '投票',
      voted: '已投',
      maxVotes: '最多可投 {max} 票',
      firstPlace: '当前第一名',
      noData: '暂无数据',
      score: '分',
      votes: '票',
    },
    // 提交页
    submit: {
      portal: '提交入口',
      title: 'Join the Evolution.',
      subtitle: '别再谈论未来了。开始交付它。',
      step1: {
        title: "1. 负责人是谁？",
        desc: "项目负责人（solo 或 duo 的名字）",
        nameLabel: "薯名 *",
        namePlaceholder: "输入薯名搜索...",
        deptLabel: "部门 *",
        partnerLabel: "伙伴",
        partnerDesc: "（Optimizer 无需填写 / Builder 可选）",
      },
      step2: {
        title: "2. 起个代号",
        desc: "取个响亮的名字（要够 punchy）",
        placeholder: "项目名称 *",
      },
      step3: {
        title: "3. 选择赛道",
        desc: "选择你的赛道",
        optimizer: "效率战士（单人）",
        builder: "产品 visionary（可组队）",
      },
      step4: {
        title: "4. 为什么做？",
        desc: "解决什么问题？背后的故事是什么？",
        placeholder: "为什么要做这个？解决什么痛点？ *",
      },
      step5: {
        title: "5. 一句话介绍",
        desc: "电梯演讲，一句话打动 VC",
        placeholder: "一句话概括，不要术语，只要冲击力 *",
      },
      step6: {
        title: "6. 展示作品",
        desc: "展示你的作品（Demo、文档、GitHub）",
        placeholder: "演示链接",
      },
      media: {
        label: "媒体附件（可选）",
        upload: "拖拽或点击上传图片/视频",
        uploading: "上传中...",
        uploaded: "已上传 {count} 个文件",
      },
      cancel: "取消",
      submit: "提交",
      submitting: "提交中...",
      success: "已提交！",
      successDesc: "你的作品已加入档案。",
    },
    // 通用
    common: {
      required: '必填',
      optional: '可选',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      save: '保存',
      loading: '加载中...',
      error: '出错了',
      retry: '重试',
      back: '返回',
    },
  },
};

export type Translations = typeof translations.zh;
