import './design.css'
import './home.css'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import AgentsSection from './components/AgentsSection'
import BenchmarkSection from './components/BenchmarkSection'
import CTASection from './components/CTASection'
import DeliveryModesSection from './components/DeliveryModesSection'
import DesignSystemSection from './components/DesignSystemSection'
import HeroSection from './components/HeroSection'
import HomeFooter from './components/HomeFooter'
import LanguageServiceSection from './components/LanguageServiceSection'
import LintSection from './components/LintSection'
import WorkflowSection from './components/WorkflowSection'

export default function Page() {
  return <>
    <DocHeader className="home-header" stickable />
    <main className="overflow:hidden home-page">
      <HeroSection />
      <DesignSystemSection />
      <LanguageServiceSection />
      <DeliveryModesSection />
      <BenchmarkSection />
      <LintSection />
      <AgentsSection />
      <WorkflowSection />
      <CTASection />
    </main>
    <HomeFooter />
  </>
}

export const metadata = {
  title: { absolute: 'Master CSS - A markup-driven CSS orchestration language for developers and AI agents' },
  description: 'Style in markup with class names and design tokens. One project manifest generates only the CSS each page uses, and checks every class the same way in your editor, your build and your AI agents.'
}
