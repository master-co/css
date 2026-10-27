import { IconArrowRight, IconBolt, IconFileCode, IconStack3 } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeSectionHeader } from './HomeBento'
import { deliveryModes, homeSections, type DeliveryModeIconId } from './home-content'

const deliveryModeIcons = {
  bolt: IconBolt,
  fileCode: IconFileCode,
  stack: IconStack3
} satisfies Record<DeliveryModeIconId, typeof IconBolt>

const pipelineSteps = [
  { code: 'class="display:grid gap-md"', label: 'Class authoring' },
  { code: 'MasterCSSManifest', label: 'Shared IR', highlighted: true },
  { code: 'style#master-css', label: 'Delivered CSS' }
]

export default function DeliveryModesSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.deliveryModes} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Delivery modes')}
          title={$('One syntax. Every delivery path.')}
          body={$('Start in the browser, build a static CSS asset, or hydrate progressively without changing how teams write classes.')}>
          <Link className="mt-lg home-section-link" href="/guide/rendering-modes">
            {$('Compare rendering modes')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <div className="margin-top:2.5rem">
          <div className="position:relative overflow:hidden p-md r-xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-raised shadow-xs">
            <div aria-hidden="true" className="position:absolute inset:0 opacity:0.5 pointer-events:none home-pipeline-glow" />
            <div className="position:relative display:grid gap-md">
              <div className="display:flex align-items:center justify-content:space-between gap-md">
                <p className="font-sm fg-text-strong">{$('Class strings stay the source of truth.')}</p>
                <span className="py-2xs px-xs r-lg font-xs bg-yellow/0.14 fg-text-strong">{$('Portable CSS delivery')}</span>
              </div>
              <div className="grid-cols(1) align-items:center gap-sm grid-cols(3)@md">
                {pipelineSteps.map((step) => (
                  <div className="min-width:0" key={step.label}>
                    <div className={clsx('overflow:hidden py-xs px-sm r-lg font-xs text-overflow:ellipsis white-space:nowrap', step.highlighted ? 'bg-yellow fg-yellow-95' : 'bg-surface-inset fg-text-strong')}>
                      {step.code}
                    </div>
                    <p className="mt-xs font-xs fg-text-muted">{$(step.label)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid-cols(1) gap-sm mt-md grid-cols(3)@lg">
            {deliveryModes.map((mode) => {
              const Icon = deliveryModeIcons[mode.icon]
              return (
                <Link className="display:block height:100% r-xl outline-offset-4xs outline-yellow:focus-visible outline-style:solid:focus-visible outline-width:2px:focus-visible" href={mode.href} key={mode.title}>
                  <div className="display:flex flex-direction:column height:100% min-height:9.5rem p-md r-xl outline-line-subtle outline-style:solid outline-width:1px bg-surface-raised home-delivery-card">
                    <div className="display:flex align-items:center justify-content:space-between gap-md">
                      <span className={clsx('display:grid place-content:center height:2.5rem width:2.5rem r-xl fg-white', mode.accentClassName)}>
                        <Icon aria-hidden="true" size={20} stroke={1.75} />
                      </span>
                      <code className="py-2xs px-xs r-lg font-xs bg-surface-inset fg-text-strong">{$(mode.signal)}</code>
                    </div>
                    <h3 className="mt-lg font-xl font-weight:560 fg-text-strong">{$(mode.title)}</h3>
                    <p className="mt-sm line-height:1.65 fg-text-muted">{$(mode.body)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
