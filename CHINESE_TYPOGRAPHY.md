# AI Demo Day - 中文字体规范

## 字体栈配置

### 标题字体 (font-headline)
```
Newsreader, Noto Serif SC, Songti SC, STSong, SimSun, serif
```
- 英文：Newsreader (优雅衬线)
- 中文：Noto Serif SC (思源宋体) / 系统宋体回退

### 正文字体 (font-body / font-label)
```
Inter, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif
```
- 优先使用系统默认中文字体
- PingFang SC (苹方) - macOS/iOS
- Hiragino Sans GB (冬青黑体) - macOS
- Microsoft YaHei (微软雅黑) - Windows

## 使用规范

### 中文正文
添加 `.chinese-text` 类：
```jsx
<p className="chinese-text">中文内容</p>
```

### 标题
标题会自动使用 font-headline，中英文搭配：
```jsx
<h2 className="font-headline text-4xl font-bold">Evolution: AI Demo Day</h2>
```

### 行高优化
- 正文：`line-height: 1.75`
- 小字：`line-height: 1.6`
- 标题：`letter-spacing: 0.02em`

## 字号规范

| 元素 | 英文 | 中文 | 类名 |
|------|------|------|------|
| 页面标题 | 36px | 36px | text-4xl |
| Section 标题 | 24px | 24px | text-2xl |
| 卡片标题 | 20px | 20px | text-xl |
| 正文 | 16px | 16px | text-base |
| 辅助文字 | 14px | 14px | text-sm |
| 标签 | 12px | 12px | text-xs |

## 回退策略

如果 Google Fonts 加载失败：
1. 标题 → 系统宋体 (Songti SC, STSong, SimSun)
2. 正文 → 系统黑体 (PingFang SC, Microsoft YaHei)

确保所有中文内容都有良好的可读性。
