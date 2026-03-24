# AI Demo Day - 统一设计规范

## 字体层级规范

### 页面标题
```
font-headline text-4xl font-bold tracking-tight text-on-surface mb-6
```
- 所有页面统一使用 4xl (36px) 粗体
- 下边距 mb-6

### 页面描述
```
text-on-surface-variant text-lg max-w-2xl leading-relaxed
```
- 使用 lg (18px) 字号

### Section 标题
```
font-headline text-2xl font-bold text-on-surface
```
- 2xl (24px) 粗体

### 卡片标题
```
font-headline text-xl font-bold text-on-surface
```
- xl (20px) 粗体

### 正文内容
```
text-base
```
- base (16px)

### 辅助文字/标签
```
text-sm
```
- sm (14px)

### 小标签
```
text-xs uppercase tracking-wide
```
- xs (12px)

## 间距规范

### 页面内边距
```
p-12 (48px)
```

### Section 间距
```
mb-16 (64px)
```

### 卡片内边距
```
p-6 (24px) 或 p-8 (32px)
```

### 元素间距
```
gap-6 (24px)
```

## 颜色规范

### 主文字
- `text-on-surface` - 主内容
- `text-on-surface-variant` - 次要内容

### 强调色
- `text-secondary` / `bg-secondary` - 红色强调
- `text-tertiary` / `bg-tertiary` - 蓝色强调

### 边框
- `border-outline-variant/10` - 淡边框
- `border-outline-variant/20` - 中等边框

## 滚动区域

### 独立滚动容器
```
overflow-y-auto custom-scrollbar
```

### 高度计算
```
h-[calc(100vh-60px)]
```
