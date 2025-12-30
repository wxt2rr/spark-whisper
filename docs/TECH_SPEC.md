# SparkWhisper - 技术实现文档 (Tech Spec)

## 1. 技术栈
- **核心语言**: TypeScript
- **构建工具**: Vite
- **框架**: Vanilla JS (无重型框架，保证性能) 或 React (如需复杂 UI 状态管理，考虑到配置页交互，推荐 React + Tailwind CSS)。本方案采用 **React** 以便快速开发拖拽和表单交互。
- **样式**: Tailwind CSS
- **压缩库**: `lz-string` (用于 URL 数据压缩)
- **动画**: HTML5 Canvas API (用于烟花), CSS3 Animations (用于 UI)

## 2. 核心模块架构

### 2.1 数据结构 (Types)
```typescript
type MediaType = 'text' | 'image';

interface BlessingItem {
  id: string;
  type: MediaType;
  content: string; // 文字内容 或 图片的 Base64/URL
  duration?: number; // 展示时长
}

interface ConfigPayload {
  items: BlessingItem[]; // 排序后的列表
  bgmIndex?: number; // 可选背景音乐索引
}
```

### 2.2 URL 编解码模块 (`UrlManager`)
由于无后端，所有数据存储在 URL 中。
- **Encode**: `JSON.stringify(payload)` -> `LZString.compressToEncodedURIComponent(string)` -> Append to URL Query/Hash.
- **Decode**: Read URL param -> `LZString.decompressFromEncodedURIComponent(string)` -> `JSON.parse`.
- **限制**: 浏览器 URL 长度通常建议控制在 2KB-8KB 内。图片必须在前端进行 Canvas 压缩（Resize to < 300px width, JPEG quality 0.5），确保 Base64 字符串足够短。若超出限制，提示用户使用图片链接或减少图片。

### 2.3 烟花引擎 (`FireworkEngine`)
参考 `NianBroken/Firework_Simulator`，使用面向对象设计：
- **`Stage`**: 管理 Canvas 上下文，处理 Resize loop。
- **`Shell` (烟花弹)**: 负责升空阶段的物理模拟 (速度, 重力)。
- **`Explosion` (爆炸)**: 负责产生粒子。
- **`Particle` (粒子)**: 负责爆炸后的物理模拟 (阻力, 重力, 闪烁, 色彩衰减)。
- **`SoundManager`**: 管理音频池 (Audio Pool)，实现无延迟的爆炸音效。

### 2.4 互动流程控制器 (`Director`)
管理从“2025”到“烟花秀”的时间线。
- **State: `Intro`**: 渲染 2025 SVG/Canvas 文本。监听用户交互（如：拖动火柴 `MatchStick` 到引信 `Fuse`）。
- **State: `Transition`**: 播放引信燃烧动画 -> 2025 炸裂 -> 2026 出现。
- **State: `Show`**: 启动 `FireworkEngine`，并根据 `ConfigPayload.items` 的顺序，定时触发特定的“文字烟花”或在屏幕中央显示祝福卡片。

## 3. 详细实现步骤

### 3.1 互动设计 (2025 -> 2026)
- **玩法**: "点燃新年"。
- **元素**: 
  - 屏幕中央巨大的 "2025" (由易碎粒子组成)。
  - 底部一根引信连接着 2025。
  - 用户手指/鼠标控制一根燃烧的火柴。
- **逻辑**: 
  - 碰撞检测: 火柴头部接触引信区域 -> 触发 `burning` 状态。
  - 动画: 引信变短 -> 接触 2025 -> 2025 粒子化爆炸 -> 冲击波散开 -> 2026 渐显 -> 第一发烟花升空。

### 3.2 烟花真实感优化
- **拖尾效果**: 使用 `ctx.globalCompositeOperation = 'destination-out'` 配合低透明度覆盖，制造残影。
- **物理**: 引入空气阻力系数，模拟粒子减速。
- **色彩**: HSL 颜色空间，实现随机且鲜艳的色彩。
- **音效**: 距离模拟（可选），或简单的随机音高变化防止声音单调。

## 4. 目录结构
```
src/
├── assets/         # 静态资源 (图片, 音效)
├── components/     # React UI 组件 (ConfigForm, PreviewModal)
├── engine/         # 烟花核心引擎
│   ├── Particle.ts
│   ├── Shell.ts
│   └── Stage.ts
├── utils/          # 工具函数 (compress, storage)
├── App.tsx         # 入口
└── main.tsx
```
