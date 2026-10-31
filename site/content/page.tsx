import './design.css'
import './home.css'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import dictionaries from '~/site/dictionaries'
import { createTranslation } from '~/site/docs-shell/utils/i18n'
import AgentsSection from './components/AgentsSection'
import BenchmarkSection from './components/BenchmarkSection'
import CTASection from './components/CTASection'
import DeliveryModesSection from './components/DeliveryModesSection'
import DesignSystemSection from './components/DesignSystemSection'
import HeroSection from './components/HeroSection'
import HomeFooter from './components/HomeFooter'
import HomeLamp from './components/HomeLamp'
import LanguageServiceSection from './components/LanguageServiceSection'
import LintSection from './components/LintSection'
import WorkflowSection from './components/WorkflowSection'

export default function Page() {
  return <>
    <DocHeader className="home-header" stickable transitionAtTop />
    <main className="overflow-clip home-page">
      <HeroSection />
      <DesignSystemSection />
      <LanguageServiceSection />
      <DeliveryModesSection />
      <BenchmarkSection />
      <LintSection />
      <AgentsSection />
      <WorkflowSection />
      <CTASection />
      <HomeLamp />
    </main>
    <HomeFooter />
  </>
}

export const metadata = {
  title: { absolute: 'Master CSS - A markup-driven CSS orchestration language for developers and AI agents' },
  description: 'Style in markup with class names and design tokens. One project manifest generates only the CSS each page uses, and checks every class the same way in your editor, your build and your AI agents.'
}

/** Localized pages keep the same title and description in their own language. */
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const $ = await createTranslation(params.locale, dictionaries)
  return { title: { absolute: $(metadata.title.absolute) }, description: $(metadata.description) }
}
