import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/internal/components/Link'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
import { MotionSection } from './HomeMotion'
import BenchmarkSizeChart from './BenchmarkSizeChart'
import { homeSections, type Translate } from './home-content'

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
            className="rel py:5xl bb:1px|solid|subtle bt:1px|solid|subtle bg:surface-raised/.26">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <h2 className="mx:0 mb:0 mt:md font-weight:560 font:34px leading:1.08 tracking:tight text:strong font:6xl@md">
                        {t('Ship the smallest critical CSS ever.')}
                    </h2>
                    <p className="max-w:64ch mb:0 mt:lg leading:1.75 text:muted">
                        {t('This benchmark starts with real documentation pages, not a slogan. Compare the CSS that reaches the first HTML response, then open the full evidence when you need the details.')}
                    </p>
                </div>

                <div className="mt:10x">
                    <BenchmarkSizeChart
                        labels={{
                            largerSuffix: t('x larger'),
                            modeLabels: {
                                brotli: t('Brotli'),
                                raw: t('Raw')
                            }
                        }}
                        pageCSSSize={pageCSSSize} />
                </div>

                <div className="mt:lg">
                    <Link href="/guide/benchmarks#page-css-size" className="inline-flex items-center gap:xs font:medium text-decoration:none text:strong">
                        {t('View page CSS benchmark')}
                        <IconArrowRight className="size:4x stroke:1.75" />
                    </Link>
                </div>
            </div>
        </MotionSection>
    )
}
