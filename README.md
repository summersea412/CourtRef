# CourtRef

面向篮球课堂与小型比赛场景的轻量裁判计时与记分工具。

_A lightweight courtside tool for scoring and timing basketball games._

> **在线体验：暂未部署** · [本地运行](#本地运行)

## Problem

篮球课进行多支队伍比赛时，裁判需要反复确认当前双方、比分、剩余时间和下一场队伍。纸笔与通用计时器把这些信息分散在不同位置，现场操作容易出错。

CourtRef 把比赛现场最高频的操作集中在一个手机优先的界面里：管理队伍、选择双方、设置时间、记录比分，并把状态保存在本地。

## MVP Scope

CourtRef V1 只解决一个明确场景：在没有登录和云端依赖的情况下，快速完成一场小型篮球比赛。

- 创建比赛存档，默认从 4 支队伍开始，也可以调整队伍数量
- 编辑队伍名称并保存到本地
- 从已有存档中选择比赛双方
- 设置 5 / 8 / 10 / 12 分钟或 1–60 分钟自定义时长
- 开始、暂停、继续和结束比赛
- 使用 +1 / +2 / +3 记录比分，并支持撤销上一步
- 根据真实时间恢复倒计时状态
- 查看未完成比赛与已完成比赛记录
- 删除存档和已完成的比赛记录
- 支持安装到主屏幕的 PWA App Shell

## Core Flow

```text
创建 / 读取队伍
        ↓
选择比赛双方
        ↓
设置比赛时间
        ↓
开始比赛
        ↓
计时 + 记分 + 撤销
        ↓
保存到本地存档
```

## Mobile First

CourtRef 的使用位置是球场边，而不是桌面后台。因此比赛页面优先考虑：

- 一眼看清剩余时间和比分
- 足够大的 +1 / +2 / +3、暂停、继续和撤销按钮
- 减少现场操作步骤
- safe-area 适配刘海、灵动岛和底部 Home Indicator
- 页面在 320px–430px 常见手机宽度下保持单列，不产生横向滚动

## Product Decisions

### 先解决四队循环的真实场景

项目最初来自篮球课裁判场景，V1 默认以四支队伍开始。先把队伍、时间、比分和比赛状态做顺，再考虑更复杂的赛程管理。

### 使用 IndexedDB 保存本地数据

CourtRef 不要求登录，也不依赖网络数据库。存档、比赛和记分操作保存在浏览器 IndexedDB 中，适合现场快速打开使用；业务数据仍由统一 Repository 管理。

### 手机优先，而不是把桌面 Dashboard 缩小

裁判需要在移动中快速确认时间和比分，所以比赛页面减少低频信息，优先保留视觉清晰度与触控空间。

### 用真实时间戳驱动倒计时

倒计时以 `startedAt`、`remainingTime` 和当前时间差为依据。页面刷新、切到后台或锁屏回来时，会重新计算真实剩余时间，而不是依赖每秒减一的 UI 定时器。

### 先做 Web/PWA，降低使用成本

Web 版本便于快速验证真实流程；PWA App Shell 让用户可以从主屏幕启动，并在没有网络时继续使用已访问过的本地应用。

## Iteration

CourtRef 按真实使用流程逐步收敛：

```text
V1 功能边界
    ↓
基础存档与队伍流程
    ↓
移动端 Editorial UI
    ↓
比赛创建、计时、记分与撤销
    ↓
未完成比赛恢复与历史记录
    ↓
PWA、离线 App Shell 与手机实战收尾
```

## Current Status

**CourtRef V1 / Resume Demo**

当前版本聚焦一个完整但克制的 MVP：从创建存档到完成比赛，覆盖队伍、计时、比分、Undo、状态恢复和本地历史记录。它不是商业化赛事管理平台，也不包含账号、云同步、AI 裁判或复杂赛程系统。

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- IndexedDB
- PWA Manifest + Service Worker

## 本地运行

```bash
git clone <repository-url>
cd CourtRef
npm install
npm run dev
```

生产构建与本地预览：

```bash
npm run typecheck
npm run build
npm run preview
```

## Screenshots

当前仓库暂未提交来自公开 Demo 的产品截图。截图会在部署真实 Demo 后补充，避免把开发工具、终端或临时预览误当成产品展示。

## Roadmap

以下内容属于 V2 / Future，不是当前 V1 能力：

- 微信小程序版本
- 更完整的赛程管理
- 比赛统计
- 云端同步

## License

当前仓库未声明开源许可证。

