import { IconArrowRight, IconCode } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import HomeAction from './HomeAction'
import HomeCodeWindow from './HomeCodeWindow'
import { heroExampleCode, homeSections } from './home-content'

export default function HeroSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.hero} className="position:relative overflow:hidden isolation:isolate home-section">
      <div className="app-wrapper home-section-wrap">
        <div className="max-w-8xl margin-inline:auto text-align:center home-rise">
          <h1 className="mt-xl font-5xl font-light line-height:1 tracking-tight text-wrap:balance fg-text-strong font-9xl@md">
            {$('The markup-driven CSS language and framework')}
          </h1>
          <p className="max-width:50ch mt-xl margin-inline:auto text-md fg-text-muted text-2xl@lg">
            {$('build websites that are readable by humans, reliable for AI agents, and expressive enough for modern design systems.')}
          </p>
          <div className="display:flex flex-wrap:wrap justify-content:center mt-2xl gap-x-md gap-y-sm">
            <HomeAction href="/guide/introduction" variant="primary">
              {$('Get started')}
              <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
            </HomeAction>
            <HomeAction href="/guide/syntax-tutorial" variant="secondary">
              <IconCode aria-hidden="true" size={16} stroke={1.75} />
              {$('Syntax tutorial')}
            </HomeAction>
          </div>
        </div>
        <div className="mt-3xl mt-4xl@md home-rise home-rise-delayed">
          <HeroExampleStage />
        </div>
      </div>
    </section>
  )
}

function HeroExampleStage() {
  const $ = useTranslation()
  return (
    <div className="position:relative overflow:hidden r-3xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-raised shadow-lg">
      <div aria-hidden="true" className="position:absolute inset:0 pointer-events:none home-hero-glow" />
      <div className="position:relative grid-cols(1) grid-cols(12)@lg">
        <HomeCodeWindow className="grid-col-span(7)@lg" lang="html" preClassName="min-height:19rem" variant="embedded">
          {heroExampleCode}
        </HomeCodeWindow>
        <div className="p-md bl-line-subtle bg-surface-inset/0.24 grid-col-span(5)@lg p-xl@lg border-left-style:solid@lg border-left-width:1px@lg">
          <div className="display:grid align-content:center height:100% min-h-2xs">
            <article className="display:grid gap-lg p-lg r-3xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-raised shadow-xs">
              <div className="display:flex align-items:center justify-content:space-between gap-md">
                <p className="text-sm fg-text-muted">{$('Design system surface')}</p>
                <span className="display:inline-flex align-items:center height:1.5rem px-xs r-lg text-xs bg-yellow/0.14 fg-text-strong">{$('Preview')}</span>
              </div>
              <div>
                <h2 className="font-2xl font-regular leading-xs fg-text-strong">{$('Agent-ready UI')}</h2>
                <p className="max-width:34ch mt-sm font-sm leading-md fg-text-muted">
                  {$('Semantic classes describe the interface before CSS is generated.')}
                </p>
              </div>
              <button className="justify-self:start py-sm px-md r-xl font-medium bg-yellow fg-yellow-95" type="button">
                {$('Ship interface')}
              </button>
              <div className="grid-cols(3) gap-xs pt-sm bt-line-subtle border-top-style:solid border-top-width:1px">
                {['Theme tokens', 'Semantic surface', 'Reliable output'].map((label) => (
                  <div className="display:grid gap-xs" key={label}>
                    <span className="height:0.375rem r-md bg-yellow" />
                    <span className="font-xs line-height:1.25 fg-text-muted">{$(label)}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
