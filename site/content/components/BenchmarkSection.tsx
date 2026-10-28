import './benchmark.css'
import { IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json'
import BenchmarkSizeChart, { type BenchmarkBrand } from './BenchmarkSizeChart'
import { HomeSectionHeader } from './HomeBento'
import { homeSections } from './home-content'

export default function BenchmarkSection() {
  const $ = useTranslation()
  const modes = getHomePageCSSSize()
  // Brand icons render on the server and reach the chart island as static slots.
  const chartBrands = Object.fromEntries(modes[0].rows.map((row): [string, BenchmarkBrand] => {
    const brand: { className?: string, src: typeof brands.mastercss.src } | undefined = Object.values(brands).find((eachBrand) => eachBrand.name === row.name)
    const Icon = brand?.src
    return [row.name, {
      icon: Icon && <Icon className={clsx('flex:none', brand?.className)} height={22} width={22} />
    }]
  }))
  return (
    <section id={homeSections.cssCost} className="position:relative home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-css-size"
          index="04"
          label={$('CSS size')}
          title={$('Only the CSS a page uses.')}
          body={$('The total CSS each documentation page delivers, measured raw and with Brotli. Master CSS ships only the rules a page uses.')}>
          <Link className="home-section-link" href="/guide/benchmarks#page-css-size">
            {$('View benchmark details')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <div className="home-bench home-marks">
          <BenchmarkSizeChart
            brands={chartBrands}
            labels={{
              caption: $('CSS per documentation page'),
              date: snapshot.generatedAt.slice(0, 10),
              modeLabels: { brotli: $('Brotli'), raw: $('Raw') },
              modeSelectorLabel: $('CSS size mode')
            }}
            modes={modes} />
        </div>
      </div>
    </section>
  )
}
