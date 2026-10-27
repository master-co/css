import './design.css'
import './home.css'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import Footer from '~/site/docs-shell/components/Footer'
import { footerProps } from '~/site/navigation'
import AgentDiagnosticsSection from './components/AgentDiagnosticsSection'
import BenchmarkSection from './components/BenchmarkSection'
import CTASection from './components/CTASection'
import DeliveryModesSection from './components/DeliveryModesSection'
import DesignSystemSection from './components/DesignSystemSection'
import HeroSection from './components/HeroSection'
import LanguageServiceSection from './components/LanguageServiceSection'
import WorkflowSection from './components/WorkflowSection'

export default function Page() {
  return <>
    <DocHeader stickable />
    <main className="overflow:hidden home-page">
      <HeroSection />
      <DesignSystemSection />
      <DeliveryModesSection />
      <BenchmarkSection />
      <AgentDiagnosticsSection />
      <LanguageServiceSection />
      <WorkflowSection />
      <CTASection />
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}

export const metadata = {
  title: { absolute: 'Master CSS - Maintainable styles in markup' },
  description: 'Compose CSS and project design rules in markup, trace the impact of changes, and check generated styles.'
}
