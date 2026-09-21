# Taste
- Prefers zero-trust takeover of AI-generated drafts: never assume prior draft is correct, independently verify accuracy, raise objections first at review start, then produce an itemized todo list of all issues to fix. Confidence: 0.9
- Requires complete sealed delivery: all issues must be raised, fixed, and resolved before final seal, with explicit completeness and consistency checks. Confidence: 0.85
- Prefers quality-first execution via orchestrated subagents: for large authoring tasks, present a subagent execution plan with prompts first, scheduled by the main dialogue to reduce hallucination and drift, then use parallel subagents for speed. Confidence: 0.85
- Requires final deliverables contain only mature product content with no demos, process artifacts, iteration comments, scaffolding configs, or code left behind. Confidence: 0.9
- Prefers AI-oriented specs optimized for on-demand lookup: clear directory overview plus precise, retrievable numbering/IDs with absolute alignment to avoid misleading AI. Confidence: 0.85
- Prefers Chinese-language discussion and responses. Confidence: 0.8
- Requires explicit user confirmation before final submission/landing; pauses for approval rather than auto-proceeding. Confidence: 0.9
- Requires safety checkpoint via local git commit before starting risky or large-scale changes to prevent loss of work progress. Confidence: 0.85
- Requires regression re-audit after every fix round: re-run strict subagent review after repairs to catch fix-introduced issues and prevent recurring per-round defects. Confidence: 0.85
