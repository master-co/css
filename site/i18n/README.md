# Local translations

English is the source language. Articles and contracts keep complete sibling
MDX files for `tw`, `ja`, `ko` and `cn`; their localized title and description
belong in frontmatter. Do not send source to an external translation API or
replace local documents with translated string segments.

Use `@master/internal-site/common/terminology.json` as the single shared
vocabulary for both sites. Translate complete
ideas and preserve prerequisites, defaults, restrictions and certainty. Japanese
uses consistent polite technical prose; Korean uses consistent formal technical
prose. Traditional Chinese uses Taiwan vocabulary. Simplified Chinese is edited
independently, not produced by converting Traditional Chinese characters.

Preserve code fences, comments, identifiers, commands, classes, technical sample
content, URLs and stable anchor IDs. Translate article prose, reader-facing
component titles and captions, alternative text and operational controls. Existing
English diagrams remain shared by all languages; do not generate locale images.
`english-samples.json` identifies sample output, shop content and the mock agent
conversation that remain English under this policy. It is not a prose fallback.

Reviews are explicit. Compare the complete translation with its source and check
the rendered reading flow before recording source and translation hashes in
`reviews.json`. A different agent must independently review the translation.
Preparation, builds and audits must never acknowledge new hashes automatically.
Missing or stale reviews block production builds. Published dates, authors and
slugs stay with the canonical English metadata; drafts stay private.
