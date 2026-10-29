import './delivery.css'
import type { CSSProperties } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import DeliveryFigures from './DeliveryFigures'
import DeliveryStage from './DeliveryStage'
import { HomeSectionHeader } from './HomeBento'
import { deliveryModes, homeSections, type DeliveryModeId } from './home-content'

/** Short names for the mode switch. */
const modeNames = {
  static: 'Static',
  progressive: 'Progressive',
  runtime: 'Runtime'
} satisfies Record<DeliveryModeId, string>

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

        {/*
          The figure carries the timeline's state for everything inside it. The drawing comes first;
          under it one control area holds the mode choice and player. The preview is the mode explanation.
          On narrow screens the controls come first, followed by the split editor, processor and preview.
        */}
        <div className="home-delivery-figure home-delivery-stage" data-moment="3" style={{ '--home-delivery-t': 4 } as CSSProperties}>
          <div className="home-delivery-layout">
            {/* The drawing is an artboard: corner marks frame it, the way a design tool marks a frame. */}
            <div className="home-delivery-drawing home-marks">
              <DeliveryStage />
              <svg aria-hidden="true" className="home-delivery-routes">
                <defs>
                  <marker id="home-delivery-arrow" markerHeight="6" markerUnits="userSpaceOnUse" markerWidth="6" orient="auto" refX="5" refY="3">
                    <path d="M0 0 5 3 0 6" fill="none" stroke="currentColor" strokeWidth="1" />
                  </marker>
                </defs>
                <path data-route="input" />
                <path data-route="rules" />
                <path data-route="paint" />
              </svg>
              <div aria-hidden="true" className="home-delivery-flights" />
            </div>

            <div className="home-delivery-controls">
              {/* Each native input lives at its visible tab, so focusing it never scrolls to the figure's top. */}
              <div aria-label={$('Rendering')} className="home-delivery-switch home-segmented-control" role="radiogroup">
                {deliveryModes.map((mode) => (
                  <label className="home-segmented-control-option" data-mode={mode.id} htmlFor={`home-delivery-${mode.id}`} key={mode.id}><input aria-label={$(mode.title)} className="sr-only" defaultChecked={'default' in mode && mode.default} id={`home-delivery-${mode.id}`} name="home-delivery-mode" type="radio" value={mode.id} />{$(modeNames[mode.id])}</label>
                ))}
              </div>
              <DeliveryFigures sectionId={homeSections.deliveryModes} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
