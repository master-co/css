import Footer from '~/internal/components/Footer'
import { footerProps } from '~/site/navigation'
import { getHomePageCSSSize } from '~/site/utils/home-page-css-size'
import BenchmarkSection from './BenchmarkSection'
import BentoSection from './BentoSection'
import CTASection from './CTASection'
import HeroSection from './HeroSection'
import type { Translate } from './home-content'

export default function HomePage({ t }: { t: Translate }) {
    const pageCSSSize = getHomePageCSSSize()

    return (
        <main className="overflow:hidden">
            <HeroSection t={t} />
            <BenchmarkSection t={t} pageCSSSize={pageCSSSize} />
            <BentoSection t={t} />
            <CTASection t={t} />
            <Footer {...footerProps} className="bg:surface-raised/.35" />
        </main>
    )
}
