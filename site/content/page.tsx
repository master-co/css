import './design.css'
import './home.css'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import Footer from '~/site/docs-shell/components/Footer'
import { footerProps } from '~/site/navigation'
import AgentsSection from './components/AgentsSection'
import BenchmarkSection from './components/BenchmarkSection'
import CTASection from './components/CTASection'
import DeliveryModesSection from './components/DeliveryModesSection'
import DesignSystemSection from './components/DesignSystemSection'
import HeroSection from './components/HeroSection'
import LanguageServiceSection from './components/LanguageServiceSection'
import LintSection from './components/LintSection'
import WorkflowSection from './components/WorkflowSection'

export default function Page() {
  return <>
    <DocHeader stickable />
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
    <Footer {...footerProps} className="app-wrapper" />
  </>
}

export const metadata = {
  title: { absolute: 'Master CSS - The markup-driven CSS language and framework' },
  description: 'Write CSS and design tokens as class names that people can read and AI agents can check. Master CSS generates only the CSS your pages use.'
}
