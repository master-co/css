import { useId, type CSSProperties } from 'react'
import { createRenderSessionSync } from '@master/css/node'
import { IconCheck } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import preset from '~/site/utils/preset-manifest'
import { cascadeProbe } from './design-system-content'
import { cascadeLayers } from './home-content'

/** The utility's layer and declaration come from the same engine as the generated stylesheet. */
function getUtilityRule() {
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    return engine.ensureClassRules([cascadeProbe.utility]).classRules[cascadeProbe.utility][0]
  } finally {
    engine.dispose()
  }
}

/** An exploded drawing in one SVG: no CSS 3D surfaces or scroll-driven style inheritance. */
export default function CascadeLayers() {
  const $ = useTranslation()
  const id = useId().replace(/:/g, '')
  const rule = getUtilityRule()
  const face = 'matrix(.78 -.32 .66 .45 48 36)'
  return (
    <div aria-label={`${$('Cascade layers from theme at the bottom to utilities at the top')}. ${$('The px-lg utility sets the padding over the btn component rule, because utilities come later.')}`} className="home-bento-visual home-layers" role="img">
      <p aria-hidden="true" className="home-layers-element">
        <span className="home-code-tag">&lt;{cascadeProbe.tag}</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;{cascadeProbe.classes.join(' ')}&quot;</span><span className="home-code-tag">&gt;</span>
      </p>
      <div aria-hidden="true" className="home-layers-figure">
        <svg className="home-layers-drawing" fill="none" viewBox="0 0 400 460">
          <defs>
            <linearGradient id={`${id}-face`} x1="0" x2=".7" y1="0" y2="1">
              <stop className="home-layer-light" />
              <stop className="home-layer-shade" offset="1" />
            </linearGradient>
            <linearGradient id={`${id}-winner`} x1="0" x2=".7" y1="0" y2="1">
              <stop className="home-layer-signal-light" />
              <stop className="home-layer-signal-shade" offset="1" />
            </linearGradient>
            <linearGradient id={`${id}-edge`} x2="0" y2="1">
              <stop className="home-layer-edge-light" />
              <stop className="home-layer-edge-shade" offset="1" />
            </linearGradient>
            <radialGradient id={`${id}-shadow`}>
              <stop className="home-layer-shadow" />
              <stop className="home-layer-shadow" offset="1" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* A soft ground contact, registration corners and extension lines locate the whole assembly. */}
          <ellipse cx="181" cy="416" fill={`url(#${id}-shadow)`} rx="150" ry="32" />
          <g className="home-layers-registration">
            <path d="M38 410v14h14m246 0h14v-14M48 374V102m251 244V74M127 428V181" strokeDasharray="2 5" />
            <path d="M25 374V82m-4 6 4-6 4 6" />
          </g>
          {cascadeLayers.map((layer, index) => {
            const wins = layer.name === rule.layer
            const component = layer.name === 'components'
            return (
              <g className="home-layer-group" data-wins={wins || undefined} key={layer.name} style={{ '--home-layer-offset': `${(2 - index) * 5}px` } as CSSProperties}>
                <g transform={`translate(0 ${338 - index * 68})`}>
                  {/* The lower copy gives the plate a machined edge; its top is a single softly lit surface. */}
                  <g transform="translate(0 3)">
                    <rect fill={`url(#${id}-edge)`} height="120" rx="13" transform={face} width="220" />
                  </g>
                  <g transform={face}>
                    <rect className="home-layer-face" fill={`url(#${id}-${wins ? 'winner' : 'face'})`} height="120" rx="13" width="220" />
                    <rect className="home-layer-inset" height="96" rx="7" width="196" x="12" y="12" />
                    <path className="home-layer-seam" d="M24 35h172" />
                    <text className="home-layer-etched" x="24" y="29">@layer</text>
                    <path className="home-layer-detail" d="M24 54h58m-58 9h83m-83 9h42" />
                    {(wins || component) && <>
                      <rect className="home-layer-rule-slot" height="26" rx="5" width="90" x="108" y="66" />
                      <text className="home-layer-rule" x="119" y="83">.{wins ? cascadeProbe.utility : cascadeProbe.component}</text>
                      {component && <path className="home-layer-strike" d="M117 78h37" />}
                      {wins && <path className="home-layer-check" d="m180 78 4 4 7-8" />}
                    </>}
                    <circle className="home-layer-pin" cx="20" cy="101" r="2" />
                    <circle className="home-layer-pin" cx="200" cy="19" r="2" />
                  </g>
                  {/* Labels face the reader, independently of the projected artwork. */}
                  <path className="home-layer-leader" d="M299 20h12" />
                  <circle className="home-layer-anchor" cx="299" cy="20" r="2" />
                  <text className="home-layer-label" x="320" y="24">{layer.name}</text>
                  <path className="home-layer-tick" d="M25 36h8" />
                  <text className="home-layer-number" textAnchor="end" x="17" y="40">0{index + 1}</text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
      <div aria-hidden="true" className="home-layers-result">
        <span className="home-layers-result-selector"><IconCheck size={14} stroke={1.75} /><code>.{cascadeProbe.utility}</code></span>
        <code className="home-layers-result-declaration">{rule.text.slice(rule.text.indexOf('{') + 1, -1)}</code>
      </div>
    </div>
  )
}
