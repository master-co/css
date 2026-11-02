# Research sources and adoption decisions

Research date: 2026-10-30. Read this file to maintain the skill or understand its design, not for every writing task. External skills informed the method. These instructions were written for Master CSS and do not require installing upstream packages or running their scripts.

## External skills

| Primary source | Adopted | Not inherited directly |
| --- | --- | --- |
| [Metabase docs-write](https://github.com/metabase/metabase/blob/master/.claude/skills/docs-write/SKILL.md) | Audience-appropriate depth, important information first, purposeful paragraphs, working examples | Product-specific word substitutions and formatter commands; Guide and Reference need different heading forms |
| [Metabase docs-review](https://github.com/metabase/metabase/blob/master/.claude/skills/docs-review/SKILL.md) | Material readability findings and actionable corrections | Inferring PR mode from tool availability, mandatory numbering, and automatic comment publication |
| [Composio content-research-writer](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/content-research-writer/SKILL.md) | Outlines tied to evidence, research gaps, opening and paragraph edits, preservation of voice | Personal writing directories, fixed hooks and conclusions, extensive default questionnaires; illustrative numbers and quotes are not facts |
| [Anthropic doc-coauthoring](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md) | Reader understanding checks that expose hidden prerequisites and ambiguity | Fixed question rounds, section-by-section approval, prescribed external products, and mandatory extra agents |
| [Corey Haines copy-editing](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copy-editing/SKILL.md) | Separate attention to clarity, voice, specificity, and proof; limited scope for point edits | Seven mandatory sweeps, emotional amplification, conversion goals, unsupported numerical rewrites, and mechanical construction bans |

Judge methods by the writing decisions they improve, not popularity or claimed scores. Combine them with repository evidence and real exercises; skill structure alone does not prove writing quality.

## Frameworks and official guidance

- [Diátaxis](https://diataxis.fr/) distinguishes tutorials, how-to guides, reference, and explanation. Use reader needs to choose the teaching approach within Guide while preserving this site's Guide/Reference/Blog organization.
- [Diátaxis Reference](https://diataxis.fr/reference/) emphasizes consistent patterns, neutral description, precision, and examples. Apply this while preserving the project's useful visual lookup material.
- [Google developer style highlights](https://developers.google.com/style/highlights) informs active voice, condition order, sentence case, descriptive links, and accessibility. Apply it in service of technical accuracy and the existing voice.
- [Google voice and tone](https://developers.google.com/style/tone) supports natural, respectful prose for readers with different levels of English fluency, avoiding condescension and excessive informality.
- [Google Technical Writing: Documents](https://developers.google.com/tech-writing/one/documents) uses prior knowledge, needs, and intended outcomes to organize content.

## Project evidence

| Source | Role in this skill |
| --- | --- |
| [AGENTS.md](../../../../AGENTS.md) and [docs pack](../../../../.ai/context/docs.md) | Source and test evidence, ownership, scope, and validation requirements |
| [site/AI.md](../../../../site/AI.md) | Authoritative content policy, teaching sequence, examples, locales, and visual guidance |
| [Reference maintenance](../../../../site/reference/MAINTENANCE.md) | Authored/generated ownership, stable anchors, and search/export consistency |
| [Container queries](../../../../site/content/guide/containers/content.mdx) and [conditions contract](../../../../site/content/guide/conditional-queries/contract.mdx) | Different teaching and lookup needs for the same subject; distinction between thresholds and tokens |
| [Vite Blog](https://master.co/blog/bootstrapping-master-css-with-vite) and [Next.js Blog](https://master.co/blog/master-css-next) | Article sources, structure, and technical subjects; existing prose still requires verification |
| [site/package.json](../../../../site/package.json) | Actual generation, lint, example, and export commands |

## Maintenance

When public behavior changes, update its authoritative contract first and check whether the skill's technical examples remain valid. When writing policy changes, update its owner instead of maintaining duplicate rules.

Revisit external sources when a real writing problem or a design change warrants it, not for every sentence edit. Record new adoption reasons and demonstrated improvements rather than accumulating unlimited banned words, templates, or procedures.
