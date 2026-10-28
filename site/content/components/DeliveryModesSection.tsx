import './delivery.css'
import type { CSSProperties } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import DeliveryFigures from './DeliveryFigures'
import DeliveryStage from './DeliveryStage'
import { HomeSectionHeader } from './HomeBento'
import HomeIllustration, { type HomeIllustrationId } from './HomeIllustration'
import { deliveryModes, homeSections, type DeliveryModeId } from './home-content'

/** Short names for the mode switch. */
const modeNames = {
  static: 'Static',
  progressive: 'Progressive',
  runtime: 'Runtime'
} satisfies Record<DeliveryModeId, string>

const modeIcons = {
  static: 'render-static',
  progressive: 'render-progressive',
  runtime: 'render-runtime'
} satisfies Record<DeliveryModeId, HomeIllustrationId>

export default function DeliveryModesSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.deliveryModes} className="home-delivery home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-rendering"
          index="03"
          label={$('Rendering')}
          title={$('One syntax. Every delivery path.')}
          body={$('Ship static CSS by default, pre-render it into HTML or generate it in the browser. Your classes stay the same.')}>
          <Link className="home-section-link" href="/guide/rendering-modes">
            {$('Compare rendering modes')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>

        {deliveryModes.map((mode) => (
          <input aria-labelledby={`home-delivery-${mode.id}-title`} className="sr-only" defaultChecked={'default' in mode && mode.default} id={`home-delivery-${mode.id}`} key={mode.id} name="home-delivery-mode" type="radio" value={mode.id} />
        ))}

        {/*
          The figure carries the timeline's state for everything inside it. The drawing comes first;
          under it one control area holds the mode choice, the player and the chosen mode's description.
          On narrow screens the controls come first and one station follows.
        */}
        <div className="home-delivery-figure home-delivery-stage" data-moment="3" style={{ '--home-delivery-t': 4 } as CSSProperties}>
          <div className="home-delivery-layout">
            {/* The drawing is an artboard: corner marks frame it, the way a design tool marks a frame. */}
            <div className="home-delivery-drawing home-marks">
              <DeliveryStage />
              <div aria-hidden="true" className="home-delivery-flights" />
            </div>

            <div className="home-delivery-controls">
              {/* Labels for the radios above: the page's segmented control, chosen by `:checked`. */}
              <div aria-hidden="true" className="home-delivery-switch home-segmented-control">
                {deliveryModes.map((mode) => (
                  <label className="home-segmented-control-option" data-mode={mode.id} htmlFor={`home-delivery-${mode.id}`} key={mode.id}>{$(modeNames[mode.id])}</label>
                ))}
              </div>
              <DeliveryFigures sectionId={homeSections.deliveryModes} />
              <div className="home-delivery-about">
                {deliveryModes.map((mode) => (
                  <div className="home-delivery-mode" data-mode={mode.id} key={mode.id}>
                    <HomeIllustration className="home-illustration-hung" icon={modeIcons[mode.id]} />
                    <p className="home-delivery-mode-title">
                      <Link className="home-heading-link" href={mode.href} id={`home-delivery-${mode.id}-title`}>{$(mode.title)}</Link>
                      {'default' in mode && mode.default && <span className="home-delivery-mode-default">{$('Default')}</span>}
                    </p>
                    <p className="home-delivery-mode-body">{$(mode.body)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
