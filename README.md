# 🏀 NBA Survival Arena

NBA 主题 2D 生存动作游戏，灵感来自 Vampire Survivors + 王者荣耀操作风格。

## 🎮 在线试玩
**[Play Now →](https://lucuncai.github.io/nba-survival-arena/)**

手机横屏体验最佳（iPhone / Android 均支持）

## 📖 游戏介绍
选择 NBA 传奇球星，在篮球场上对抗四面八方涌来的反派球员。运用走位和技能存活下去！

### 可选角色
| 角色 | 定位 | 特色 |
|------|------|------|
| 👑 LeBron James | 近战坦克 | The Block / And One / 空接扣篮 / 转身扣篮 |
| 🐍 Kobe Bryant | 中距离刺客 | 后仰跳投 / Fadeaway / Mamba Mentality |
| 🎯 Stephen Curry | 远程射手 | 三分射击 / Splash Zone / Logo Shot |

### 敌人类型
- 🏀 **恶棍球员** — 基础敌人，数量多
- 💪 **脏球手** — 会撞人定身
- ⭐ **全明星对手** — 血厚难杀
- 🎯 **远程射手** — 远距离攻击

### 操作
- **左手摇杆** — 移动
- **右侧按钮** — 技能释放
- **自动攻击** — 范围内最近敌人
- 升级 3 选 1 强化

## 🏗️ 技术架构

### 引擎 & 框架
- **Phaser.js 3.80.1** — WebGL 2D 游戏引擎（内嵌，零 CDN 依赖）
- **单文件 HTML** — 所有代码、资产、引擎打包在一个 `index.html`
- **Web Audio API** — 程序化音效生成，无外部音频文件

### 代码结构
```
index.html (单文件，~2.3MB)
├── <script> Phaser.js 3.80.1 内嵌 (~1.2MB)
├── SPRITE_DATA — 14 张 AI 生成 sprite sheets (WebP base64)
│   ├── 角色: lebron/kobe/curry × walk/idle/attack
│   └── 敌人: fan/ref/rival/press × walk
├── ENEMY_TYPES — 敌人属性定义
├── CHARACTER_DEFS — 角色属性 & 技能定义
├── SFX — Web Audio 音效系统
├── preCalculateSpriteDimensions() — 运行时自动计算帧尺寸
├── BootScene — 资源加载
├── MenuScene — 角色选择界面
└── GameScene — 游戏主逻辑
    ├── 物理系统 (Arcade Physics)
    ├── 虚拟摇杆 (触控)
    ├── 自动攻击 & 弹道系统
    ├── 技能系统 (4 技能 × 3 角色)
    ├── 升级系统 (3 选 1)
    ├── 敌人 AI & 波次生成
    └── 粒子特效 & HUD
```

### 美术资产
- 角色 & 敌人 sprite sheets 由 AI（Meta Imagine）生成
- 背景使用 rembg (U²-Net) 去除
- WebP 压缩（quality 55）保持文件小
- 帧尺寸运行时从图片实际宽度自动计算（`frameCount`），不 hardcode

### 部署
- **GitHub Pages** — 静态文件托管
- 每次更新自动 push + QA 检查（10 项）
- 零服务端依赖，纯前端

## 🔧 开发

### QA 检查
每次提交前运行：
```bash
bash qa.sh
```

### 本地运行
直接浏览器打开 `index.html` 即可，无需服务器。

## 📝 版本历史
- **v7.4** — LeBron 技能大改（The Block / And One / 空接 / 转身扣篮），新敌人 sprite，XP 平衡
- **v7.3** — Phaser.js 重构，AI sprite sheets，音效系统
- **v7.0** — 从纯 Canvas 迁移到 Phaser.js
- **v1-v6** — Canvas 原型迭代

## 📄 License
Personal project, not for commercial use.
