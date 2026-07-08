# 服务器监控数据可视化大屏 — 设计文档

**日期**: 2026-07-08  
**项目**: datacenter 监控大屏  
**数据库**: MySQL 8.0 (Docker), monitor 库, 4 表, ~80k 条记录, 20 台主机

---

## 1. 概述

基于现有 MySQL `monitor` 数据库，构建一个运维监控数据可视化大屏。PC 端 1920×1080 满屏 5 区域仪表盘布局，移动端线性堆叠自适应。Next.js 14 全栈，ECharts 5 图表，Tailwind CSS 样式。

### 数据现状

| 表 | 记录数 | 描述 |
|---|---|---|
| host_detail | 20 | 主机信息 (hostid, hostname, owner, model, 机柜位置) |
| mod_detail | 55 | 监控模块定义 (CPU/内存/磁盘/网络 等) |
| pref_tsar | 67,200 | 性能时序数据 (7天, 6类指标) |
| disk_tsar | 12,000 | 磁盘时序数据 (7天, 5类指标) |

数据时间范围: 2026-07-01 ~ 2026-07-07

---

## 2. 页面布局

### PC 端 (≥1280px)

```
┌─────────────────────────────────────────────────────────┐
│  顶部状态栏: 标题 + 实时时钟 + 在线主机数 + 告警计数        │
├──────────┬────────────────────────┬──────────────────────┤
│ 左侧      │       中央区域          │       右侧             │
│ 主机列表   │   CPU 使用率趋势 (折线)   │   磁盘延迟热力/TOPN    │
│ (可筛选)   │   内存使用趋势 (面积)      │   磁盘利用率 (柱状)    │
│ 点击聚焦   │   系统负载趋势 (折线)      │   磁盘读写速率         │
│ 状态指示   │                        │                      │
├──────────┴────────────────────────┴──────────────────────┤
│  底部: 网络流量趋势 (双Y轴) ∥ 进程数趋势                    │
└──────────────────────────────────────────────────────────┘
```

### 移动端 (<768px)

- 顶部 KPI 横滑卡片, 每次显示 2 个
- 主机列表改为下拉选择器
- 所有区域从上到下单列堆叠, 图表 100% 宽, 固定高 280px
- touch 交互, 无 hover

---

## 3. 技术选型

| 层 | 技术 | 版本 |
|---|---|---|
| 框架 | Next.js | 14 (App Router) |
| 语言 | TypeScript | 5.x |
| 图表 | ECharts | 5.5 |
| 样式 | Tailwind CSS | 3.4 |
| 数据库驱动 | mysql2 | 3.x |
| 部署 | Node.js 单进程 | `next start` |

---

## 4. 数据流架构

```
MySQL 8.0 (Docker:3306)        Next.js Server            Browser
──────────────────────        ──────────────            ───────
  mysql2 连接池                 API Routes              ECharts 渲染
    ↓                            ↓                        ↑
  SELECT ──→ /api/overview ──→ Server Component ──→ 顶部 KPI
  SELECT ──→ /api/hosts    ──→ client fetch    ──→ 主机列表
  SELECT ──→ /api/metrics/*──→ client fetch    ──→ 各图表组件
```

### 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据获取 | Server Component SSR + 客户端 fetch 轮询 | 首屏快 + 实时性 |
| 刷新间隔 | PC 30s / 移动端 60s | 平衡实时与负载 |
| 默认时间窗 | 最近 24h | 运维大屏聚焦近期 |
| 服务端缓存 | Map 内存缓存, TTL 10s | 多组件同源请求去重 |
| 错误处理 | 每个图表独立 loading/error 态 | 单点故障不影响全局 |
| mysql2 配置 | connectionLimit: 10 | Docker 容器资源约束 |

---

## 5. API 设计

所有 API 返回 JSON, 均为 GET

| Endpoint | 参数 | 返回 | 用途 |
|---|---|---|---|
| `/api/overview` | — | cpu均值, mem均值, load均值, host数, 在线数 | 顶部 KPI |
| `/api/hosts` | `?search=` | hostid, hostname, model, location, 在线状态 | 左侧列表 |
| `/api/metrics/cpu` | `?hostid=&hours=24` | [{ts, cpu_usage, cpu_idle, cpu_sys, cpu_user, cpu_wait}] | CPU 趋势 |
| `/api/metrics/memory` | `?hostid=&hours=24` | [{ts, total, used, buff, cache}] | 内存趋势 |
| `/api/metrics/load` | `?hostid=&hours=24` | [{ts, load1, load5, load15}] | 负载趋势 |
| `/api/metrics/disk` | `?hostid=&hours=24` | [{ts, mod, value}] | 磁盘指标 |
| `/api/metrics/network` | `?hostid=&hours=24` | [{ts, recv_mb, send_mb, pkg_recv, pkg_send}] | 网络流量 |
| `/api/detail/[hostid]` | `?hours=24` | hostinfo + all metrics | 单主机详情 |

---

## 6. 组件树 & 目录结构

```
datacenter/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── app/
│   ├── layout.tsx                # 根布局, 元数据, 全局样式
│   ├── page.tsx                  # 大屏主页面 (组装区域)
│   ├── globals.css               # Tailwind + 暗色大屏主题
│   ├── api/
│   │   ├── overview/route.ts
│   │   ├── hosts/route.ts
│   │   └── metrics/
│   │       ├── cpu/route.ts
│   │       ├── memory/route.ts
│   │       ├── load/route.ts
│   │       ├── disk/route.ts
│   │       └── network/route.ts
│   └── components/
│       ├── dashboard/
│       │   ├── HeaderBar.tsx      # 顶部 KPI 条 + 时钟
│       │   ├── HostList.tsx       # 主机列表 (可搜索/可点选)
│       │   ├── CpuChart.tsx
│       │   ├── MemoryChart.tsx
│       │   ├── LoadChart.tsx
│       │   ├── DiskPanel.tsx      # 磁盘热力 + 利用率 + IOPS
│       │   ├── NetworkChart.tsx   # 网络流量 (双Y轴)
│       │   └── ProcessChart.tsx   # 进程数趋势
│       └── ui/
│           ├── StatCard.tsx       # 通用 KPI 卡片
│           └── ChartContainer.tsx # 通用图表容器 (loading/error/empty)
├── lib/
│   ├── db.ts                     # mysql2 连接池
│   ├── cache.ts                  # 内存缓存
│   └── types.ts                  # TypeScript 类型
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-07-08-monitoring-dashboard-design.md
```

### 组件职责

- **HeaderBar**: 显示标题、实时时钟 (客户端 tick)、主机总数、CPU/内存均值, 无数据依赖时显示骨架屏
- **HostList**: 获取 `/api/hosts`, 渲染可搜索列表, 点击选中主机传递给父组件, 影响所有图表筛选
- **CpuChart / MemoryChart / LoadChart / NetworkChart / ProcessChart**: 各自 fetch 自己的 API Route, 渲染 ECharts, 独立 loading/error 状态
- **DiskPanel**: 包含 3 个子图表 (延迟热力、利用率柱状、读写速率), 共享一次 API 请求
- **ChartContainer**: 统一处理 loading (骨架)、error (重试按钮)、empty (空态提示) 三种状态
- **StatCard**: 纯展示 — 接收 label/value/unit/trend, 渲染彩色数值卡片

### 数据状态管理

不引入 Redux/Zustand。用 React Context 管理两个全局状态:
- `SelectedHostContext`: 当前聚焦主机 (默认 "全部" / null)
- `TimeRangeContext`: 时间范围 (24h / 7d)

---

## 7. 移动端适配

| 维度 | PC (≥1280px) | 移动 (<768px) |
|------|-------------|--------------|
| 布局 | Grid 5 区域 | flex-col 单列 |
| 主机列表 | 左侧边栏常驻 | 顶部下拉 Popover |
| KPI | 横排 6 卡片 | 横滑 2 个可见, overflow-x scroll |
| 图表高度 | 300~400px 自适应 | 固定 280px |
| 图表宽度 | 列宽占比 | 100% |
| 刷新 | 30s | 60s |
| 字体 | text-sm ~ text-xl | 缩小一档 |
| Tooltip | hover 触发 | touch 长按触发 |
| viewport | — | initial-scale=1, max-scale=1, no-zoom |

**实现方式**: Tailwind 响应式前缀 (`lg:`, `md:`) + `useMediaQuery` hook 辅助禁用动画

---

## 8. 视觉设计

- **主题**: 暗色运维大屏风格, 背景 `#0a0e27` 深蓝黑
- **配色**: 
  - 主色: `#00d4ff` 青色 (数据、高亮)
  - 辅色: `#7c3aed` 紫色 (次强调)
  - CPU 系列: `#00d4ff` / `#38bdf8` / `#818cf8`
  - 内存系列: `#34d399` / `#a3e635`
  - 磁盘系列: `#fb923c` / `#fbbf24` / `#f87171`
  - 网络: `#60a5fa` / `#c084fc` (收发双色)
- **卡片**: 半透明深色背景 + 1px 边框 `rgba(0,212,255,0.15)`, 圆角 12px
- **字体**: 系统等宽字体 (Tabular Nums 用于数字)
- **动画**: 数据刷新淡入过渡 300ms, KPI 数字滚动 (requestAnimationFrame)

---

## 9. 非功能需求

| 项 | 要求 |
|---|---|
| 页面加载 | 首屏白屏 ≤ 2s |
| API 响应 | 单接口 P95 ≤ 500ms |
| 错误隔离 | 单图表故障不影响其他区域 |
| 浏览器 | Chrome 90+, Edge 90+, Safari 15+ |
| 连接安全 | 数据库密码通过环境变量 `DB_PASSWORD` 注入, 不硬编码 |
| git | 代码提交本地 git, 含 .gitignore |

---

## 10. 风险 & 边界

- **数据库只读**: 大屏不写数据, 连接池用只读事务
- **MySQL 容器**: 假设 Docker mysql8 始终在线, 不做断连重试 UI
- **时间戳**: millisecond unix timestamp, 前端统一处理
- **不做告警**: 当前只做可视化, 无阈值告警/通知功能
- **不做登录**: 单机部署, 无用户认证

---

## 自检清单

- [x] 无 TBD / TODO 占位符
- [x] 前后一致: API 端点名称与组件一一对应
- [x] 范围明确: 可视化大屏, 不含告警/登录/管理功能
- [x] 无歧义: 所有交互行为已描述具体实现方式
