# NBA Survival Arena — Hoop Defense

NBA 主题 2D 生存动作游戏，灵感来自 Vampire Survivors + 王者荣耀操作风格。**守护篮筐，拦截每一球。**

## 在线试玩

**[Play Now](https://lucuncai.github.io/nba-survival-arena/)** — 手机横屏体验最佳（iPhone / Android 均支持）

## 游戏介绍

选择 NBA 传奇球星，在篮球场上守护中央篮筐。敌人从四面八方涌来，接近篮筐后投篮得分。你需要：

- **击杀敌人** — 在他们投篮前消灭，赚取经验升级
- **拦截投篮** — 用身体挡球或使用技能拦截飞行中的篮球
- **存活** — 尽可能久地保护篮筐不被摧毁

篮筐被摧毁或角色被击败时游戏结束。

## 可选角色

| 角色 | 定位 | HP | ATK | SPD | 玩法 |
|------|------|----|-----|-----|------|
| LeBron James | Paint Guardian | 350 | 55 | 210 | 近战坦克，力量与控制 |
| Kobe Bryant | Perimeter Assassin | 280 | 60 | 230 | 高机动性，精准击杀 |
| Stephen Curry | Zone Controller | 200 | 48 | 220 | 远程火力覆盖 |

每个角色拥有 **3 个主动技能** (Q1/Q2/Q3) 和 **1 个大招** (R)。

### LeBron James 技能
- **The Block** — 扇形拍击，摧毁范围内所有飞行中的篮球
- **And One** — 无敌冲锋，击退路径上所有敌人
- **Earthquake** — AOE 震地，眩晕附近敌人 2 秒
- **King's Domain** — 力场：敌人减速 50%，持续 8 秒

### Kobe Bryant 技能
- **Fadeaway** — 后撤步 + 3 发穿透射击
- **Viper Strike** — 穿刺突进，高伤害 + 流血效果
- **Lockdown** — 恐慌 3 个最近敌人，停止射击 3 秒
- **Mamba Mode** — 攻击力 +200%，移速 +50%，持续 10 秒

### Stephen Curry 技能
- **Splash Bomb** — 爆炸篮球，AOE 伤害 + 摧毁敌方篮球
- **Crossover** — 360 度弹幕环，击退敌人
- **Pick & Roll** — 召唤幻影墙壁，阻挡敌人和篮球 5 秒
- **Night Night** — 子弹时间：敌人和篮球减速至 20%，持续 6 秒

## 敌人类型

| 敌人 | 行为 | 威胁 |
|------|------|------|
| Rookie | 近距离快速投篮，低伤害 | 低 |
| Mid-Range Vet | 中距离，中等命中率 | 中 |
| Sharpshooter | 远距离狙击，高单发伤害 | 高 |
| Power Center | 高血量，近距离，投篮不可打断 | 高 |
| All-Star MVP (Boss) | 超高血量，高伤害，周期性刷新 | 极高 |

## 操作

| 输入 | 动作 |
|------|------|
| WASD / 方向键 | 移动 |
| J | 技能 1 |
| K | 技能 2 |
| L | 技能 3 |
| Space | 大招 |
| 左半屏触控摇杆 | 移动（手机） |
| 右侧技能按钮 | 技能（手机） |

## 核心系统

**敌人 AI 状态机** — 接近 → 蓄力 → 投篮 → 冷却 → 循环。蓄力阶段可被击退打断（Power Center 除外）。

**Boss 波次** — 每 60 秒刷新一个强力 Boss，带专属警告动画和屏幕震动。每波难度递增。

**道具掉落** — 击杀敌人有概率掉落：佳得乐（回血 25%）、闪电鞋（加速 10s）、炸弹篮球（范围爆炸）、修复包（篮筐回血）。Boss 掉率 5 倍。

**升级系统** — 每次升级从 14 种强化中随机 3 选 1，包括战斗属性和篮筐防御两大类。

**本地记录** — 最佳存活时间、击杀数、拦截数、等级保存到 localStorage。

## 项目结构

```
nba-survival-arena/
├── index.html              # 打包后的单文件游戏（自动生成）
├── html_head_v2.txt        # HTML/CSS 模板
├── assemble.py             # 构建脚本 — 拼接 src/ 到 index.html
├── src/
│   ├── config.js           # 全局常量（视口、世界、篮筐）
│   ├── sfx.js              # Web Audio API 音效系统
│   ├── records.js          # localStorage 记录持久化
│   ├── enemies.js          # 敌人类型定义
│   ├── characters.js       # 可玩角色定义
│   ├── upgrades.js         # 升级词条池
│   ├── drops.js            # 掉落物品定义
│   ├── sprites.js          # Sprite 尺寸预计算
│   └── scenes/
│       ├── BootScene.js        # 资源加载和动画注册
│       ├── MenuScene.js        # 角色选择菜单
│       ├── GameScene.js        # 主游戏场景（生命周期、HUD、输入）
│       ├── GameScene_Combat.js     # 自动攻击、伤害、弹道
│       ├── GameScene_EnemyAI.js    # 敌人状态机、投篮、得分
│       ├── GameScene_Spawning.js   # 波次生成、Boss 生成
│       ├── GameScene_Skills.js     # 角色技能实现（12 个技能）
│       └── GameScene_Upgrade.js    # 升级弹窗
│   └── main.js             # Phaser 配置和启动
```

## 构建

游戏以单个 `index.html` 文件分发，内嵌 Phaser 3、sprite 数据和所有游戏逻辑。编辑源文件后重新构建：

```bash
python3 assemble.py
cp index_v2.html index.html
```

## 技术架构

- **Phaser.js 3.80.1** — WebGL 2D 游戏引擎（内嵌，零 CDN 依赖）
- **Web Audio API** — 程序化音效生成，无外部音频文件
- **Mixin 模式** — `GameScene` 通过 `Object.assign` 拆分为 6 个职责模块
- **Base64 Sprites** — 14 张 AI 生成 chibi 风格 sprite sheets（WebP 压缩）
- **localStorage** — 本地最佳记录持久化
- **GitHub Pages** — 静态文件托管，零服务端依赖

## 部署

直接浏览器打开 `index.html`，或使用任意静态文件服务器：

```bash
python3 -m http.server 8080
```

兼容 GitHub Pages — 推送 `index.html` 到仓库根目录即可。

## 版本历史

- **v10.0** — 完全重构代码架构：单体 2000 行 JS 拆分为 17 个模块化源文件；修复敌人投篮系统（球速度被 physics group 重置）；修复升级弹窗点击穿透；新增被动身体拦截机制；游戏模式从生存改为篮筐防御（Hoop Defense）；新增 4 种射程不同的敌人 AI；平衡性全面调整
- **v9.0** — 全面重制 sprite 美术资产：AI 重新生成 14 张高质量 chibi 风格 sprite sheet
- **v8.0** — Boss 波次系统、道具掉落、敌人 HP 条、增强角色选择 UI、本地记录保存
- **v7.4** — LeBron 技能大改，新敌人 sprite，XP 平衡
- **v7.0** — 从纯 Canvas 迁移到 Phaser.js
- **v1-v6** — Canvas 原型迭代

## License

MIT
