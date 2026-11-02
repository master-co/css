import type { homeIconArtwork } from '~/site/assets/images/home/icons/artwork'

export type HomeIllustrationId = keyof typeof homeIconArtwork

export type HomeCompactIconId = Extract<HomeIllustrationId, `lint-${string}` | `mcp-${string}` | 'agent-edit-file'>
