# AI Demo Day - 设计规范

## 页面标题规范

所有页面标题统一使用以下样式：

```jsx
<h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-6">
  页面标题
</h2>
<p className="text-on-surface-variant text-base max-w-2xl leading-relaxed">
  页面描述
</p>
```

### 各页面标题

| 页面 | 标题 | 描述 |
|------|------|------|
| Entry | Registration | 请输入你的薯名和部门 |
| Guide | Event Guide / AI Demo Day | 探索AI与战略洞察的交汇点... |
| Gallery | Gallery | 探索所有提交的 Demo 项目 |
| Leaderboard | 实时投票排名 | 每个赛道最多可投 2 票... |
| Square | Square | 发布你的需求、想法或寻找合作伙伴 |
| Admin | 管理员面板 | 当前用户: xxx |

## Section 标题规范

次级标题统一使用：

```jsx
<h3 className="font-headline text-xl font-bold">标题内容</h3>
// 或
<h3 className="font-headline text-2xl font-bold">标题内容</h3>
```

## 页面内边距

所有主内容区统一使用：

```jsx
<div className="p-12">
  {/* 内容 */}
</div>
```

- 有侧边栏的页面：`ml-64` + `p-12`
- Entry 页面：全屏居中布局

## 卡片/区块样式

统一使用：

```jsx
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
  {/* 内容 */}
</div>
```

## 小标签/副标题

```jsx
<span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">
  标签文字
</span>
```

## 字体层级

| 用途 | 类名 |
|------|------|
| 页面大标题 | `text-4xl font-bold` |
| Section 标题 | `text-2xl font-bold` / `text-xl font-bold` |
| 卡片标题 | `text-lg font-bold` |
| 正文 | `text-base` |
| 小字/标签 | `text-xs` / `text-[10px]` |

## 颜色使用

- 主文字：`text-on-surface`
- 次要文字：`text-on-surface-variant`
- 强调色（红）：`text-secondary` / `bg-secondary`
- 强调色（蓝）：`text-tertiary` / `bg-tertiary`
- 边框：`border-outline-variant/10` / `border-outline-variant/20`

## 间距规范

- 页面内边距：`p-12`
- Section 间距：`gap-12` / `mb-12`
- 卡片内边距：`p-8` / `p-6`
- 元素间距：`gap-4` / `gap-6` / `gap-8`
