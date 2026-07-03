import Footer from '~/internal/components/Footer'
import { footerProps } from '~/site/navigation'
import { getHomeBrowserCSSCost } from '~/site/utils/home-browser-css-cost'
import BenchmarkSection from './BenchmarkSection'
import BentoSection from './BentoSection'
import CTASection from './CTASection'
import HeroSection from './HeroSection'
import type { Translate } from './home-content'

export default function HomePage({ t }: { t: Translate }) {
    const benchmark = getHomeBrowserCSSCost()

    return (
        <main className="overflow:hidden">
            <HeroSection t={t} />
            <BenchmarkSection t={t} benchmark={benchmark} />
            <BentoSection t={t} />
            <CTASection t={t} />
            <Footer {...footerProps} className="bg:surface-raised/.35" />
        </main>
    )
}
