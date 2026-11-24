---
name: ai-specs-dialogue-scene
description: Bundled offline floor skill for dialogue subtext, character voice differentiation, and sensory scene description when remote screenwriting or fiction craft skills are unavailable.
---
# ai-specs-dialogue-scene（内包含台词与描写兜底技能）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 适用时机

当用户未安装远程 `sw-dialogue` / `book-writer` 等专精技能，或要求离线直出高质量台词与场景描写时，直接启用本兜底规范。

## 台词核心红线

- **潜台词优先**：禁止角色直接把内心情绪或设定说明书念出来；让台词成为“争夺主动权或掩饰真实意图”的动作。
- **遮名测试**：遮住说话人名字后，凭句长、用词习惯、信息盲区与礼貌程度仍能区分角色身份。
- **去情绪副词**：删除“愤怒地说”“冷冷地笑”等标签，改用打断、停顿、转移话题与具体小动作承载情绪。

## 描写核心红线

- **近距限知零过滤词**：删除“他感到/她看到/他听到”等隔阂词，直接写身体反应、触觉、气味、声响与光影变化。
- **物性显影与句长波动**：每段至少落 1 个可触摸的物理细节；长句铺垫压迫与空间，短句落锤转折与动作。
- **连载网文联动**：若属长篇网文场景，联动读取 `writing/rules/core.md` 与 `writing/rules/web-novel.md`，并用 `scripts/check-writing.py` 校验 `web-novel` 项。
