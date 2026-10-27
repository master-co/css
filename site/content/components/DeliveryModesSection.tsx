import './delivery.css'
import { IconArrowRight, IconBolt, IconBrowser, IconFileCode, IconServer, IconStack3 } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { HomeBentoFrame, HomeSectionHeader } from './HomeBento'
import { deliveryFlowPackets, deliveryFlowSources, deliveryModes, homeSections, type DeliveryModeId } from './home-content'

const MasterCSSLogo = brands.mastercss.src

const modeIcons = {
  static: IconFileCode,
  progressive: IconStack3,
  runtime: IconBolt
} satisfies Record<DeliveryModeId, typeof IconBolt>

const stageIcons = {
  static: IconFileCode,
  progressive: IconServer,
  runtime: IconBrowser
} satisfies Record<DeliveryModeId, typeof IconBolt>

/** Diagram geometry in the SVG's 1200 × 480 view box; HTML nodes are placed by the same numbers. */
const laneY = [110, 240, 370]
const sourcePath = (y: number) => `M232 ${y} C 352 ${y}, 352 240, 468 240`
const outputPath = (y: number) => `M732 240 C 832 240, 832 ${y}, 928 ${y}`

export default function DeliveryModesSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.deliveryModes} className="home-delivery home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="02"
          label={$('Deliver')}
          title={$('One syntax, from build to browser.')}
          body={$('Static CSS by default. Pre-render it into HTML, hydrate it progressively, or generate it in the browser. Your classes stay the same.')}>
          <Link className="mt-lg home-section-link" href="/guide/rendering-modes">
            {$('Compare rendering modes')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>

        {deliveryModes.map((mode) => (
          <input aria-labelledby={`home-delivery-${mode.id}-title`} className="sr-only" defaultChecked={'default' in mode && mode.default} id={`home-delivery-${mode.id}`} key={mode.id} name="home-delivery-mode" type="radio" value={mode.id} />
        ))}

        <HomeBentoFrame>
          <div className="home-flow">
            <svg aria-hidden="true" className="home-flow-wires" viewBox="0 0 1200 480">
              <defs>
                {laneY.map((y, index) => <path d={sourcePath(y)} id={`home-flow-source-${index}`} key={`source-${y}`} />)}
                {deliveryModes.map((mode, index) => <path d={outputPath(laneY[index])} id={`home-flow-output-${mode.id}`} key={mode.id} />)}
              </defs>
              <path className="home-flow-wire" d="M600 96 L600 168" />
              {laneY.map((y, index) => <use className="home-flow-wire" href={`#home-flow-source-${index}`} key={y} />)}
              {deliveryModes.map((mode) => <use className="home-flow-output-wire home-flow-wire" data-mode={mode.id} href={`#home-flow-output-${mode.id}`} key={mode.id} />)}
              {laneY.map((y, index) => [0, 1].map((round) => {
                const label = deliveryFlowPackets[index * 2 + round]
                const width = label.length * 8 + 24
                // Packets fade out before the three paths converge at the engine.
                return (
                  <g className="home-flow-packet" key={label} opacity="0">
                    <rect height="26" rx="13" width={width} x={-width / 2} y="-13" />
                    <text dominantBaseline="central" textAnchor="middle">{label}</text>
                    <animateMotion begin={`${index * 0.9 + round * 2.4}s`} dur="4.8s" repeatCount="indefinite">
                      <mpath href={`#home-flow-source-${index}`} />
                    </animateMotion>
                    <animate attributeName="opacity" begin={`${index * 0.9 + round * 2.4}s`} dur="4.8s" keyTimes="0;0.1;0.2;0.52;0.62;1" repeatCount="indefinite" values="0;0;1;1;0;0" />
                  </g>
                )
              }))}
              {deliveryModes.map((mode) => [0, 1, 2].map((round) => (
                <circle className="home-flow-pulse" data-mode={mode.id} key={`${mode.id}-${round}`} opacity="0" r="6">
                  <animateMotion begin={`${round}s`} dur="3s" repeatCount="indefinite">
                    <mpath href={`#home-flow-output-${mode.id}`} />
                  </animateMotion>
                  <animate attributeName="opacity" begin={`${round}s`} dur="3s" keyTimes="0;0.15;0.85;1" repeatCount="indefinite" values="0;1;1;0" />
                </circle>
              )))}
            </svg>

            <div className="home-flow-column home-flow-sources">
              <p className="home-flow-column-label">{$('Sources')}</p>
              {deliveryFlowSources.map((source) => (
                <div className="home-flow-node home-flow-source" key={source.file}>
                  <span className="home-flow-file">{source.file}</span>
                  <code className="home-flow-code">{source.code}</code>
                </div>
              ))}
            </div>

            <div className="home-flow-entry">
              <span className="home-flow-file">master.css</span>
              <code className="home-flow-code">@theme · @utility</code>
            </div>

            <div className="home-flow-engine">
              <span aria-hidden="true" className="home-flow-engine-ring" />
              <span className="position:relative display:flex align-items:center gap-sm">
                <MasterCSSLogo aria-hidden="true" className="flex:none" height={36} width={36} />
                <span>
                  <span className="display:block text-md font-semibold fg-text-strong">{$('Master CSS engine')}</span>
                  <span className="display:block font-2xs fg-text-muted">{$('One set of Rust semantics')}</span>
                </span>
              </span>
              <ol className="home-flow-steps">
                {['Scan', 'Validate', 'Generate'].map((step) => <li key={step}>{$(step)}</li>)}
              </ol>
            </div>

            <div className="home-flow-column home-flow-outputs">
              <p className="home-flow-column-label">{$('Delivered')}</p>
              {deliveryModes.map((mode) => {
                const Icon = stageIcons[mode.id]
                return (
                  <div className="home-flow-node home-flow-output" data-mode={mode.id} key={mode.id}>
                    <span className="display:flex align-items:center gap-2xs font-2xs font-semibold tracking-wider text-transform:uppercase fg-text-muted">
                      <Icon aria-hidden="true" size={14} stroke={1.75} />
                      {$(mode.stage)}
                    </span>
                    <span className="display:flex flex-wrap:wrap gap-3xs">
                      {mode.artifacts.map((artifact) => <code className="home-flow-artifact" key={artifact}>{artifact}</code>)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="home-delivery-modes">
            {deliveryModes.map((mode) => {
              const Icon = modeIcons[mode.id]
              return (
                <label className="home-delivery-card" data-mode={mode.id} htmlFor={`home-delivery-${mode.id}`} key={mode.id}>
                  <span className="display:flex align-items:center justify-content:space-between gap-md">
                    <span className="home-delivery-icon">
                      <Icon aria-hidden="true" size={20} stroke={1.75} />
                    </span>
                    {'default' in mode && mode.default && <span className="home-tag">{$('Default')}</span>}
                  </span>
                  <span className="home-delivery-title" id={`home-delivery-${mode.id}-title`}>{$(mode.title)}</span>
                  <span className="home-delivery-body">{$(mode.body)}</span>
                  <Link className="home-delivery-link home-section-link" href={mode.href}>
                    {$('How it works')}
                    <IconArrowRight aria-hidden="true" size={14} stroke={1.75} />
                  </Link>
                </label>
              )
            })}
          </div>
        </HomeBentoFrame>
      </div>
    </section>
  )
}
