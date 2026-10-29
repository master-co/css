import '~/site/styles/brand.css'
import Footer from '~/site/docs-shell/components/Footer'
import Link from '~/site/docs-shell/components/Link'
import { footerProps } from '~/site/navigation'
import BrandNavigation from './BrandNavigation'
import BrandAppearance from './BrandAppearance'

export default function BrandLayout({ children, params }: any) {
  const tw = params.locale === 'tw'
  return <>
    <main className="brand-page">
      <noscript><style>{'.brand-page .demo-copy,.brand-page .brand-range-label,.brand-page .brand-control-actions,.brand-appearance{display:none!important}'}</style><p className="brand-static-note">Select a variable name to copy it manually. All artwork downloads and section links remain available.</p></noscript>
      <header className="brand-hero">
        <BrandAppearance />
        <div className="brand-hero-copy">
          <p className="brand-overline"><span className="brand-signal" aria-hidden="true" />Master CSS <span aria-hidden="true">/</span> {tw ? '品牌與設計系統' : 'Brand & design system'}</p>
          <h1>{tw ? <>共同的語言。<br />清晰的識別。</> : <>One language.<br />A clear identity.</>}</h1>
          <p className="brand-hero-lead">{tw ? '為開發者與 AI agents 打造的設計語言。以清晰的結構、細緻的互動，以及恰到好處的金色，讓每個部分彼此連貫。' : 'A design language for developers and AI agents. Clear structure, considered interactions, and a small point of gold connect every part.'}</p>
          <div className="brand-hero-actions"><a className="brand-primary-link" href="#download-assets">{tw ? '取得品牌素材' : 'Get the assets'}<span aria-hidden="true">↓</span></a><a href="#identity">{tw ? '探索設計系統' : 'Explore the system'}<span aria-hidden="true">↘</span></a></div>
        </div>
        <figure className="brand-hero-art" aria-label={tw ? 'Master CSS 原始金色標誌' : 'The original Master CSS gold mark'}>
          <div className="brand-mark-board"><span className="brand-board-label">M / 01</span><div className="brand-mark-clearspace"><img src="/images/logo.svg" width="312" height="169" alt="" /><span className="brand-mark-axis brand-mark-axis-x" /><span className="brand-mark-axis brand-mark-axis-y" /></div><span className="brand-board-caption">Master CSS <span>Original mark</span></span></div>
        </figure>
      </header>
      <div className="brand-document">
        <BrandNavigation />
        <article className="brand-content prose" lang="en">{children}</article>
      </div>
      <div className="brand-next"><p className="brand-overline">{tw ? '從規範到實作' : 'From principles to practice'}</p><h2>{tw ? '讓每一個細節，成為同一套系統。' : 'Make the details part of the same system.'}</h2><Link href="/design-system">{tw ? '探索元件與實作手冊' : 'Explore components & authoring'}<span aria-hidden="true">↗</span></Link></div>
    </main>
    <Footer {...footerProps} className="app-wrapper" />
  </>
}
