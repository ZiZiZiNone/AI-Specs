# 写作规范总入口（`writing/`）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录为 **按需启用、零编码负担** 的全场景写作规范体系，覆盖 6 大高频写作场景与 1 套跨全品类网文专属风格体系。日常代码开发任务**不加载本目录（0 Token 消耗）**；仅当任务为写作、润色、改稿或内容创作时按需激活。

## 按需加载策略（严格 1+1 加载）

每次写作任务**只加载 2 个核心文件**，禁止全量通读 6 个场景文件：

1. **必读底线（1 份）**：`writing/rules/core.md`（通用去 AI 味、简明表达、事实逻辑与目标对齐）
2. **场景细则（1 份）**：按下方路由表选取对应场景文件

| 写作场景 | 适用任务范围 | 按需加载文件 | 核心方法论底座 |
|---|---|---|---|
| **报告与方案** | 汇报总结、调研分析、立项方案、项目复盘 | `writing/rules/report.md` | 金字塔原理 + SCQA/MECE + 亚马逊叙事备忘录 |
| **文章与深度内容** | 公众号长文、专栏文章、新闻资讯、行业评论 | `writing/rules/article.md` | 倒金字塔 + 核心导语（Nut Graf）+ 沙漏结构 + NN/g 扫读模型 |
| **宣传稿与营销文案** | 产品发布、活动推广、品牌软文、种草、详情页 | `writing/rules/copywriting.md` | Schwartz 五阶认知 + AIDA/PAS/FAB/BAB + Unbounce 可读性实证 |
| **网文连载与全类型小说** | 玄幻、仙侠、悬疑/规则怪谈、科幻、都市、历史、言情 | `writing/rules/web-novel.md` | **「实感克制 · 规则博弈流」** 5 大专属风格指纹 + 6 大全品类适配 |
| **说明与操作文档** | 产品手册、SOP、使用教程、FAQ、知识库 | `writing/rules/documentation.md` | Diátaxis 四象限框架 + Google / Microsoft 技术文档规范 |
| **职场沟通与函件** | 正式邮件、公告通知、会议纪要、对外致函 | `writing/rules/correspondence.md` | BLUF 结论先行 + ISO 24495-1 + GOV.UK 简明标准 |

## 辅助资产与自动门禁

- 交付前自检：`writing/checklists/writing-check.md`（按场景勾选，网文含 5 项风格指纹核验）
- 正反例对照：`writing/examples/anti-ai-rewrites.md`（AI 流水线味 → 顶级人类/专属风格改写示范）
- 自动化校验：`scripts/check-writing.py`（已被 `hooks/adapter.py` 集成，写作模式自动拦截 AI 味套话、网文烂梗与句长均质化）

## 与工程规范的边界

- 写作任务默认遵循 `writing/rules/core.md` 与对应场景规范；当场景为网文、深度文章或营销文案时，以对应场景开篇法则为准，不机械套用 `common/rules/communication.md` 的工程汇报模板。
- 涉及真实数据、政策、引用或外部事实时，仍须严格遵守 `common/rules/constitution.md` 中的 `COM-014`（禁止编造事实与来源）。
