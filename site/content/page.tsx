import './home.css'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import Footer from '~/site/docs-shell/components/Footer'
import { footerProps } from '~/site/navigation'
import AgentDiagnosticsSection from './components/AgentDiagnosticsSection'
import BenchmarkSection from './components/BenchmarkSection'
import CTASection from './components/CTASection'
import DeliveryModesSection from './components/DeliveryModesSection'
import DesignSystemSection from './components/DesignSystemSection'
import DevelopmentWorkflowSection from './components/DevelopmentWorkflowSection'
import HeroSection from './components/HeroSection'
import LanguageServiceSection from './components/LanguageServiceSection'

export default function Page() {
  return <>
    <DocHeader stickable />
    <main className="overflow:hidden">
      <HeroSection />
      <DesignSystemSection />
      <BenchmarkSection />
      <AgentDiagnosticsSection />
      <LanguageServiceSection />
      <DevelopmentWorkflowSection />
      <DeliveryModesSection />
      <CTASection />
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}

export const metadata = {
  title: { absolute: 'Master CSS - Maintainable styles in markup' },
  description: 'Compose CSS and project design rules in markup, trace the impact of changes, and check generated styles.'
}
