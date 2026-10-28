import type { ComponentType, CSSProperties, ReactNode, SVGProps } from 'react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { bounds, place, project, slab, viewBox, type Bounds, type Point2, type Point3, type Slab } from './workflow-geometry'
import { workflowFrameworks, workflowIntegrations } from './workflow-content'

type Brand = { name: string, src: ComponentType<SVGProps<SVGSVGElement>>, className?: string }
type Tier = 'manifest' | 'integrations' | 'frameworks'
type Variant = 'wide' | 'narrow'

interface StageLayout {
  /** Framework cells per row; the grid fills column by column, back row first. */
  columns: number
  cellSpacing: number
  /** How far the rows shift apart, in cells, so the back row shows between the front logos. */
  stagger: number
  rowDepth: number
  frameworkZ: number
  integrationZ: number
  /** Integration chip positions on their plate as [x, depth], in `workflowIntegrations` order. */
  integrations: readonly (readonly [number, number])[]
  integrationPlate: readonly [halfWidth: number, halfDepth: number]
  manifestPlate: readonly [halfWidth: number, halfDepth: number]
  /** Which frameworks the layout shows, by index into `workflowFrameworks`. */
  frameworks: readonly number[]
}

// Heights in stage units: threads meet the integration chip and the manifest card at their middle.
const integrationChip = 1.1
const manifestCard = 1.6
const plateDepth = 0.18
const manifestThickness = 0.55

const layouts: Record<Variant, StageLayout> = {
  wide: {
    columns: 8,
    cellSpacing: 2.2,
    stagger: 0.25,
    rowDepth: 4.4,
    frameworkZ: 9.8,
    integrationZ: 4.9,
    integrations: workflowIntegrations.map((_, index) => [(index - 3) * 2.6, 0] as const),
    integrationPlate: [9.6, 1.8],
    manifestPlate: [5.6, 2.4],
    frameworks: workflowFrameworks.map((_, index) => index)
  },
  narrow: {
    columns: 4,
    cellSpacing: 2.9,
    stagger: 0,
    rowDepth: 4.4,
    frameworkZ: 11.2,
    integrationZ: 5.8,
    integrations: [[-4.35, -2.4], [-3.4, 2.4], [-1.45, -2.4], [0, 2.4], [1.45, -2.4], [3.4, 2.4], [4.35, -2.4]],
    integrationPlate: [5.7, 3.5],
    manifestPlate: [3.9, 2.3],
    // One framework for each integration, and Vue beside Vite.
    frameworks: [0, 2, 8, 11, 12, 13, 14, 15]
  }
}

interface StageScene {
  box: Bounds
  /** Construction lines from the corners of each upper plate to the same corners of the plate below. */
  guides: string[]
  plates: Record<Tier, Slab>
  frameworks: Map<number, { foot: Point2, integration: number }>
  integrations: Point2[]
  manifest: Point2
}

function buildScene(layout: StageLayout): StageScene {
  const frameworkHalf = (layout.columns - 1) / 2 * layout.cellSpacing + layout.cellSpacing * 0.8
  const frameworkDepth = layout.rowDepth / 2 + 1.1
  const [integrationHalf, integrationDepth] = layout.integrationPlate
  const [manifestHalf, manifestDepth] = layout.manifestPlate
  const frameworks = new Map(layout.frameworks.map((index, order) => {
    const column = Math.floor(order / 2)
    const back = order % 2 === 0
    const x = (column - (layout.columns - 1) / 2) * layout.cellSpacing + (back ? 1 : -1) * layout.cellSpacing * layout.stagger
    const y = (back ? 1 : -1) * layout.rowDepth / 2
    const integration = workflowIntegrations.findIndex((item) => item.key === workflowFrameworks[index].integration)
    return [index, { foot: project([x, y, layout.frameworkZ]), integration }]
  }))
  const corner = (from: Point3, to: Point3) => {
    const [x1, y1] = project(from)
    const [x2, y2] = project(to)
    return `M${x1} ${y1} L${x2} ${y2}`
  }
  const extremes: Point2[] = [
    project([-frameworkHalf, frameworkDepth, layout.frameworkZ]),
    project([frameworkHalf, frameworkDepth, layout.frameworkZ]),
    ...[...frameworks.values()].map(({ foot }) => [foot[0], foot[1] - 2.1] as const),
    project([-frameworkHalf, -frameworkDepth, layout.frameworkZ]),
    project([-integrationHalf, -integrationDepth, layout.integrationZ]),
    project([integrationHalf, integrationDepth, layout.integrationZ]),
    project([-manifestHalf, -manifestDepth, -manifestThickness - 0.8]),
    project([manifestHalf, manifestDepth, -manifestThickness])
  ]
  return {
    box: bounds(extremes, [0.1, 0.1, 0.1, 0.1]),
    // Each plate's corners run straight to the same corners of the plate below, like an exploded drawing.
    guides: [
      ...[[-1, -1], [1, -1], [1, 1]].map(([sx, sy]) => corner([sx * frameworkHalf, sy * frameworkDepth, layout.frameworkZ - plateDepth], [sx * integrationHalf, sy * integrationDepth, layout.integrationZ])),
      ...[[-1, -1], [1, -1], [1, 1]].map(([sx, sy]) => corner([sx * integrationHalf, sy * integrationDepth, layout.integrationZ - plateDepth], [sx * manifestHalf, sy * manifestDepth, 0]))
    ],
    plates: {
      manifest: slab(-manifestHalf, manifestHalf, -manifestDepth, manifestDepth, 0, manifestThickness),
      integrations: slab(-integrationHalf, integrationHalf, -integrationDepth, integrationDepth, layout.integrationZ, plateDepth),
      frameworks: slab(-frameworkHalf, frameworkHalf, -frameworkDepth, frameworkDepth, layout.frameworkZ, plateDepth)
    },
    frameworks,
    integrations: layout.integrations.map(([x, y]) => project([x, y, layout.integrationZ])),
    manifest: project([0, 0.5, 0])
  }
}

const scenes: Record<Variant, StageScene> = { wide: buildScene(layouts.wide), narrow: buildScene(layouts.narrow) }
const variants = ['wide', 'narrow'] as const

/** The middle of a chip standing on `foot`. */
const middle = ([x, y]: Point2, height: number): Point2 => [x, Math.round((y - height / 2) * 1000) / 1000]

/** Coordinates for both layouts as custom properties; the stage picks one with a container query. */
function placeBoth(at: (scene: StageScene) => Point2 | undefined) {
  const style: Record<string, string> = {}
  for (const variant of variants) {
    const point = at(scenes[variant])
    if (!point) continue
    const { left, top } = place(point, scenes[variant].box)
    style[`--home-wf-${variant}-x`] = left
    style[`--home-wf-${variant}-y`] = top
  }
  return style as CSSProperties
}

const brandOf = (index: number) => brands[workflowFrameworks[index].brand] as Brand
const integrationTrace = (scene: StageScene, integration: number) => [...scene.frameworks].filter(([, framework]) => framework.integration === integration).map(([index]) => index).join(' ')
const first = 0
const litIf = (trace: string) => trace.split(' ').includes(String(first)) ? '' : undefined

/** One SVG per layout for a band of the drawing; only the current layout's shows. */
function Layer({ children }: { children: (scene: StageScene, variant: Variant) => ReactNode }) {
  return variants.map((variant) => (
    <svg aria-hidden="true" className={clsx('home-wf-stage-layer', `home-wf-stage-${variant}`)} key={variant} viewBox={viewBox(scenes[variant].box)}>
      {children(scenes[variant], variant)}
    </svg>
  ))
}

/**
 * Every framework builds through an integration, and every integration loads the same project
 * manifest. The stage draws that as three plates: the frameworks' logos stand on the top one, the
 * integrations on the middle one and the ink CSS entry on the base. A gold signal climbs from the
 * base to one framework at a time; pointing at or focusing a logo traces its own path.
 */
export default function WorkflowStage() {
  const $ = useTranslation()
  const stageStyle = Object.fromEntries(variants.flatMap((variant) => [
    [`--home-wf-${variant}-units`, scenes[variant].box.width],
    [`--home-wf-${variant}-ratio`, `${scenes[variant].box.width} / ${scenes[variant].box.height}`]
  ])) as CSSProperties
  return (
    <div className="home-wf-figure home-wf-stage-figure" data-wf="stage">
      <div className="home-wf-stage" style={stageStyle}>
        <Layer>
          {(scene, variant) => (
            <>
              <defs>
                <linearGradient id={`home-wf-plate-${variant}`} x1="0" x2="0" y1="1" y2="0">
                  <stop className="home-wf-plate-near" offset="0" />
                  <stop className="home-wf-plate-far" offset="1" />
                </linearGradient>
                {/* A soft band of light across each top face, as if from a window up and to the left. */}
                <linearGradient id={`home-wf-sheen-${variant}`} x1="0" x2="1" y1="0" y2="1">
                  <stop className="home-wf-sheen-edge" offset="0.18" />
                  <stop className="home-wf-sheen-peak" offset="0.38" />
                  <stop className="home-wf-sheen-edge" offset="0.62" />
                </linearGradient>
                <linearGradient id={`home-wf-front-${variant}`} x1="0" x2="0" y1="0" y2="1">
                  <stop className="home-wf-front-top" offset="0" />
                  <stop className="home-wf-front-bottom" offset="1" />
                </linearGradient>
                <filter height="300%" id={`home-wf-blur-${variant}`} width="140%" x="-20%" y="-100%">
                  <feGaussianBlur stdDeviation="0.45" />
                </filter>
                <filter height="200%" id={`home-wf-glow-${variant}`} width="200%" x="-50%" y="-50%">
                  <feGaussianBlur stdDeviation="0.14" />
                </filter>
              </defs>
              {scene.guides.map((d) => <path className="home-wf-guide" d={d} key={d} />)}
              <Plate shape={scene.plates.manifest} tier="manifest" variant={variant} />
              {scene.integrations.map((foot, index) => {
                const [x1, y1] = middle(scene.manifest, manifestCard)
                const [x2, y2] = middle(foot, integrationChip)
                const trace = integrationTrace(scene, index)
                return <line className="home-wf-thread" data-lit={litIf(trace)} data-trace={trace} key={index} x1={x1} x2={x2} y1={y1} y2={y2} />
              })}
            </>
          )}
        </Layer>
        <div aria-hidden="true" className="home-wf-manifest home-wf-stage-item" style={placeBoth((scene) => scene.manifest)}>
          <code className="home-wf-manifest-name">index.css</code>
        </div>
        <Layer>
          {(scene, variant) => (
            <>
              <Plate shape={scene.plates.integrations} tier="integrations" variant={variant} />
              {/* Threads run under the top plate and come up through it at each logo's foot. */}
              {[...scene.frameworks].map(([index, framework]) => {
                const [x1, y1] = middle(scene.integrations[framework.integration], integrationChip)
                const [x2, y2] = framework.foot
                return <line className="home-wf-thread" data-lit={litIf(String(index))} data-trace={index} key={index} x1={x1} x2={x2} y1={y1} y2={y2} />
              })}
              <Plate shape={scene.plates.frameworks} tier="frameworks" variant={variant} />
              {[...scene.frameworks].map(([index, framework]) => (
                <ellipse className="home-wf-landing" cx={framework.foot[0]} cy={framework.foot[1]} data-lit={litIf(String(index))} data-trace={index} key={index} rx={0.5} ry={0.17} />
              ))}
              {[...scene.frameworks].map(([index, framework]) => {
                const [mx, my] = middle(scene.manifest, manifestCard)
                const [ix, iy] = middle(scene.integrations[framework.integration], integrationChip)
                const [fx, fy] = framework.foot
                const d = `M${mx} ${my} L${ix} ${iy} L${fx} ${fy}`
                // A blurred trail follows the bright head along the same path.
                return (
                  <g data-lit={litIf(String(index))} data-trace={index} key={index}>
                    <path className="home-wf-signal-trail" d={d} filter={`url(#home-wf-glow-${variant})`} pathLength={1} />
                    <path className="home-wf-signal" d={d} pathLength={1} />
                  </g>
                )
              })}
            </>
          )}
        </Layer>
        {/* Integration chips sit over the threads that land on them. */}
        {workflowIntegrations.map((integration, index) => {
          const trace = [...new Set(variants.flatMap((variant) => integrationTrace(scenes[variant], index).split(' ')))].join(' ')
          return (
            <span aria-hidden="true" className="home-wf-integration home-wf-stage-item" data-lit={litIf(trace)} data-trace={trace} key={integration.key} style={placeBoth((scene) => scene.integrations[index])}>
              {integration.key}
            </span>
          )
        })}
        {/* Back row first, so the front row stands in front of it. */}
        {workflowFrameworks.map((_, index) => index).sort((a, b) => (scenes.wide.frameworks.get(a)!.foot[1] - scenes.wide.frameworks.get(b)!.foot[1])).map((index) => {
          const { name, src: Logo, className } = brandOf(index)
          return (
            <Link
              aria-label={$('{name} installation guide').replace('{name}', name)}
              className={clsx('home-wf-framework home-wf-stage-item', !scenes.narrow.frameworks.has(index) && 'home-wf-stage-wide-only')}
              data-lit={litIf(String(index))}
              data-trace={index}
              data-wf-node={index}
              href={`/guide/installation/${workflowFrameworks[index].guide}`}
              key={index}
              style={placeBoth((scene) => scene.frameworks.get(index)?.foot)}>
              <Logo aria-hidden="true" className={clsx('home-wf-framework-logo', className)} height={20} width={20} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Plate({ shape, tier, variant }: { shape: Slab, tier: Tier, variant: Variant }) {
  return (
    <g className={clsx('home-wf-plate', `home-wf-plate-${tier}`)}>
      <polygon className="home-wf-plate-shadow" filter={`url(#home-wf-blur-${variant})`} points={shape.shadow} />
      <polygon className="home-wf-plate-front" fill={`url(#home-wf-front-${variant})`} points={shape.front} />
      <polygon className="home-wf-plate-side" points={shape.side} />
      <polygon className="home-wf-plate-top" fill={`url(#home-wf-plate-${variant})`} points={shape.top} />
      <polygon className="home-wf-plate-sheen" fill={`url(#home-wf-sheen-${variant})`} points={shape.top} />
      <polyline className="home-wf-plate-flank" points={shape.flank} />
      <polyline className="home-wf-plate-rim" points={shape.rim} />
    </g>
  )
}
