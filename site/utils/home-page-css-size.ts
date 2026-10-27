import snapshot from '~/site/../benchmarks/docs-page-css-size/snapshot.json'

type CSSSizeKind = 'brotliBytes' | 'rawBytes'

export type HomePageCSSSizeModeId = 'brotli' | 'raw'

export interface HomePageCSSSizeRow {
  bytes: number
  isMasterCSS: boolean
  name: string
  /** The page's CSS size divided by the Master CSS page's size, to one decimal. */
  ratio: number
}

export interface HomePageCSSSizeMode {
  id: HomePageCSSSizeModeId
  maxBytes: number
  rows: HomePageCSSSizeRow[]
}

const pages = snapshot.pages
const masterCSSPage = pages.find((page) => page.name === 'Master CSS') || pages[0]

function createMode(id: HomePageCSSSizeModeId, kind: CSSSizeKind): HomePageCSSSizeMode {
  const masterBytes = masterCSSPage.css.total[kind]
  return {
    id,
    maxBytes: Math.max(...pages.map((page) => page.css.total[kind])),
    rows: [...pages]
      .sort((a, b) => a.css.total[kind] - b.css.total[kind])
      .map((page) => ({
        bytes: page.css.total[kind],
        isMasterCSS: page.name === masterCSSPage.name,
        name: page.name,
        ratio: Number((page.css.total[kind] / masterBytes).toFixed(1))
      }))
  }
}

/** Page CSS totals from the committed documentation page snapshot, smallest first. */
export function getHomePageCSSSize(): HomePageCSSSizeMode[] {
  return [
    createMode('brotli', 'brotliBytes'),
    createMode('raw', 'rawBytes')
  ]
}
