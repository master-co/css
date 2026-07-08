import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/internal/components/Link'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
import { MotionSection } from './HomeMotion'
import BenchmarkSizeChart from './BenchmarkSizeChart'
import { homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type Translate } from './home-content'

type PageCSSSize = ReturnType<typeof getHomePageCSSSize>

export default function BenchmarkSection({
    pageCSSSize,
    t
}: {
    pageCSSSize: PageCSSSize
    t: Translate
}) {
    return (
        <MotionSection
            homeSection={homeSections.cssCost}
            id={homeSections.cssCost}
            className="rel py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Fastest delivery')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Ship the smallest CSS ever.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Measured from real documentation pages, Master CSS keeps critical styling small without reducing expressiveness, so modern interfaces stay fast to ship and light to load.')}
                    </p>
                </div>

                <div className="mt:10x">
                    <BenchmarkSizeChart
                        labels={{
                            largerSuffix: t('x larger'),
                            modeLabels: {
                                brotli: t('Brotli'),
                                raw: t('Raw')
                            },
                            modeSelectorLabel: t('CSS size mode')
                        }}
                        pageCSSSize={pageCSSSize} />
                </div>

                <div className="mt:lg">
                    <Link href="/guide/benchmarks#page-css-size" className="inline-flex items-center gap:xs text-decoration:none text:muted">
                        {t('View benchmark detail')}
                        <IconArrowRight className="size:4x stroke:1.75" />
                    </Link>
                </div>
            </div>
        </MotionSection>
    )
}
