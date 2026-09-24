/* eslint-disable @next/next/no-img-element */
import { getColorHex } from '../data/color-palette'
import Link from './Link'

declare type PackageProps = {
  repo?: string
  npm?: string
  source?: string
  translate?: (text: string) => string
}

export default function PackageBadges({ repo, npm, source, translate = (text) => text }: PackageProps) {
  const lightBg = getColorHex('neutral', 5)
  const lightFg = getColorHex('neutral', 50)
  const darkBg = getColorHex('neutral', 80)
  const darkFg = getColorHex('neutral', 40)
  const lightQ = `color=${lightBg}&logoColor=${lightFg}&style=for-the-badge`
  const darkQ = `color=${darkBg}&logoColor=${darkFg}&style=for-the-badge`
  const $ = translate
  return (
    <div className='flex gap:xs min-h:28px mt:md'>
      {repo && <Link aria-label={$('GitHub release (latest by date including pre-releases)')} href={`https://github.com/${repo}/releases`}>
        <img className='r:sm hidden@dark' alt={$('GitHub release (latest by date including pre-releases)')} src={`https://img.shields.io/github/v/release/${repo}?${lightQ}&label=%20&logo=github&include_prereleases`} />
        <img className='r:sm hidden@light' alt={$('GitHub release (latest by date including pre-releases)')} src={`https://img.shields.io/github/v/release/${repo}?${darkQ}&label=%20&logo=github&include_prereleases`} />
      </Link>}
      {npm && <Link aria-label={$('NPM package')} href={`https://www.npmjs.com/package/${npm}`}>
        <img className='r:sm hidden@dark' alt={$('NPM package (download/month)')} src={`https://img.shields.io/npm/dm/${npm}?${lightQ}&label=%20&logo=npm`} />
        <img className='r:sm hidden@light' alt={$('NPM package (download/month)')} src={`https://img.shields.io/npm/dm/${npm}?${darkQ}&label=%20&logo=npm`} />
      </Link>}
      {npm && <Link aria-label={$('NPM package size (gzipped size)')} href={`https://www.npmjs.com/package/${npm}`}>
        <img className='r:sm hidden@dark' alt={$('NPM package size (gzipped size)')} src={`https://img.shields.io/bundlephobia/minzip/${npm}?${lightQ}&label=%20&logo=npm`} />
        <img className='r:sm hidden@light' alt={$('NPM package size (gzipped size)')} src={`https://img.shields.io/bundlephobia/minzip/${npm}?${darkQ}&label=%20&logo=npm`} />
      </Link>}
      {source && <Link aria-label={$('Source code')} href={source}>
        <img className='r:sm hidden@dark' alt={$('Source code')} src={`https://img.shields.io/badge/Source-${lightBg}?${lightQ}&label=%20`} />
        <img className='r:sm hidden@light' alt={$('Source code')} src={`https://img.shields.io/badge/Source-${darkBg}?${darkQ}&label=%20`} />
      </Link>}
    </div>
  )
}
