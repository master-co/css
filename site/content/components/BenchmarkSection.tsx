import { IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
import BenchmarkSizeChart, { type BenchmarkBrand } from './BenchmarkSizeChart'
import { HomeSectionHeader } from './HomeBento'
import { homeSections } from './home-content'

/** Bar fills fold brand colors into a compact set of homepage tones. */
const brandColorClassNames: Record<string, string> = {
  beryl: 'bg-green',
  blue: 'bg-blue',
  cyan: 'bg-cyan',
  gray: 'bg-neutral',
  green: 'bg-green',
  orange: 'bg-orange',
  pink: 'bg-red',
  purple: 'bg-purple',
  sky: 'bg-blue',
  yellow: 'bg-yellow'
}

export default function BenchmarkSection() {
  const $ = useTranslation()
  const modes = getHomePageCSSSize()
  // Brand icons render on the server and reach the chart island as static slots.
  const chartBrands = Object.fromEntries(modes[0].rows.map((row): [string, BenchmarkBrand] => {
    const brand: { className?: string, color?: string, src: typeof brands.mastercss.src } | undefined = Object.values(brands).find((eachBrand) => eachBrand.name === row.name)
    const Icon = brand?.src
    return [row.name, {
      colorClassName: row.isMasterCSS ? 'bg-yellow' : brandColorClassNames[brand?.color ?? ''] ?? 'bg-blue',
      icon: Icon && <Icon className={clsx('flex:none', brand?.className)} height={28} width={28} />
    }]
  }))
  return (
    <section id={homeSections.cssCost} className="position:relative home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Fastest delivery')}
          title={$('Ship the smallest CSS ever.')}
          body={$('Measured from real documentation pages, Master CSS keeps critical styling small without reducing expressiveness, so modern interfaces stay fast to ship and light to load.')} />
        <div className="margin-top:2.5rem">
          <BenchmarkSizeChart
            brands={chartBrands}
            labels={{
              largerSuffix: $('x larger'),
              modeLabels: { brotli: $('Brotli'), raw: $('Raw') },
              modeSelectorLabel: $('CSS size mode')
            }}
            modes={modes} />
        </div>
        <Link className="mt-lg home-section-link" href="/guide/benchmarks#page-css-size">
          {$('View benchmark detail')}
          <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
        </Link>
      </div>
    </section>
  )
}
