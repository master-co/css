# Claude Instructions

Read `AGENTS.md` first. It is the canonical AI instruction file for this repository.

Then read `.ai/context/index.md` and choose the smallest task-specific context pack. Use `.ai/context/package-routing.md` when paths, packages, or a diff are known. Escalate to deeper `.ai/*.md` references only when the selected pack or `.ai/context/accuracy-guardrails.md` requires it.

Always read the affected package `package.json` and package-local `AI.md`, if present, before changing package code.
