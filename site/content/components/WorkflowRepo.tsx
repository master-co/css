import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { bounds, place, project, slab, viewBox, type Point2, type Point3, type Slab } from './workflow-geometry'
import { workflowProjectClass, workflowProjects } from './workflow-content'

// Heights in stage units: lines meet each chip at its middle.
const entryChip = 1.25
const fileChip = 1.9
const rootChip = 1.15

/** The repository base and one plate per app above it, the first app on top. */
const appZ = [9.6, 4.8]
const appPlate = { half: 6, depth: 2.1, thickness: 0.18 }
const basePlate = { half: 4.4, depth: 1.7, thickness: 0.5 }
const entryAt = (z: number): Point3 => [-3.9, 1, z]
const fileAt = (z: number): Point3 => [2.9, -1, z]
const rootAt: Point3 = [0, 0.3, 0]

const middle = ([x, y]: Point2, height: number): Point2 => [x, Math.round((y - height / 2) * 1000) / 1000]

const scene = (() => {
  const apps = appZ.map((z) => ({
    plate: slab(-appPlate.half, appPlate.half, -appPlate.depth, appPlate.depth, z, appPlate.thickness),
    entry: project(entryAt(z)),
    file: project(fileAt(z)),
    label: (() => {
      const [x, y] = project([-appPlate.half, -appPlate.depth, z - appPlate.thickness])
      return [x + 0.3, y + 0.3] as const
    })()
  }))
  const extremes: Point2[] = [
    project([-appPlate.half, appPlate.depth, appZ[0]]),
    project([appPlate.half, appPlate.depth, appZ[0]]),
    [apps[0].entry[0], apps[0].entry[1] - entryChip - 0.3],
    project([-appPlate.half, -appPlate.depth, appZ[1] - 1.2]),
    project([-basePlate.half, -basePlate.depth, -basePlate.thickness - 0.8]),
    project([basePlate.half, basePlate.depth, -basePlate.thickness])
  ]
  return {
    box: bounds(extremes, [0.1, 0.1, 0.1, 0.1]),
    base: slab(-basePlate.half, basePlate.half, -basePlate.depth, basePlate.depth, 0, basePlate.thickness),
    root: project(rootAt),
    apps
  }
})()

/**
 * Two apps over one repository use the same class. Each app is a plate with its own CSS entry; the
 * class on each plate resolves through that nearest entry, so its swatch shows that app's own color,
 * while both entries import the shared tokens on the base. The figure alternates between the two.
 */
export default function WorkflowRepo() {
  const style = { '--home-wf-units': scene.box.width, aspectRatio: `${scene.box.width} / ${scene.box.height}` } as CSSProperties
  return (
    <div className="home-wf-figure home-wf-repo" data-active="0" data-wf="repo">
      <div aria-hidden="true" className="home-wf-repo-stage" style={style}>
        <svg className="home-wf-stage-layer" viewBox={viewBox(scene.box)}>
          <defs>
            <linearGradient id="home-wf-repo-plate" x1="0" x2="0" y1="1" y2="0">
              <stop className="home-wf-plate-near" offset="0" />
              <stop className="home-wf-plate-far" offset="1" />
            </linearGradient>
            <linearGradient id="home-wf-repo-sheen" x1="0" x2="1" y1="0" y2="1">
              <stop className="home-wf-sheen-edge" offset="0.18" />
              <stop className="home-wf-sheen-peak" offset="0.38" />
              <stop className="home-wf-sheen-edge" offset="0.62" />
            </linearGradient>
            <linearGradient id="home-wf-repo-front" x1="0" x2="0" y1="0" y2="1">
              <stop className="home-wf-front-top" offset="0" />
              <stop className="home-wf-front-bottom" offset="1" />
            </linearGradient>
            <filter height="300%" id="home-wf-repo-blur" width="140%" x="-20%" y="-100%">
              <feGaussianBlur stdDeviation="0.45" />
            </filter>
          </defs>
          <RepoPlate shape={scene.base} />
          {/* Both entries import the shared tokens: dashed lines down to the base, behind the plates they cross. */}
          {scene.apps.map(({ entry }, index) => {
            const [x1, y1] = middle(entry, entryChip)
            const [x2, y2] = middle(scene.root, rootChip)
            return <line className="home-wf-repo-import" data-scope={index} key={index} x1={x1} x2={x2} y1={y1} y2={y2} />
          })}
        </svg>
        <span className="home-wf-repo-chip home-wf-repo-root" style={place(scene.root, scene.box)}>index.css</span>
        {/* The lower app first, so the upper one stands in front of it. */}
        {[1, 0].map((index) => {
          const app = scene.apps[index]
          const project = workflowProjects[index]
          const entry = middle(app.entry, entryChip)
          const file = middle(app.file, fileChip)
          return (
            <div className="home-wf-repo-app" data-scope={index} key={project.directory}>
              <svg className="home-wf-stage-layer" viewBox={viewBox(scene.box)}>
                <RepoPlate shape={app.plate} />
                {/* The class resolves through its nearest entry: one 1px connector, a gold point on the one in use. */}
                <line className="home-wf-repo-link" x1={file[0]} x2={entry[0]} y1={file[1]} y2={entry[1]} />
                <circle className="home-wf-repo-point" cx={(file[0] + entry[0]) / 2} cy={(file[1] + entry[1]) / 2} r={0.12} />
              </svg>
              <span className="home-wf-repo-label" data-wf-node={index} style={place(app.label, scene.box)}>{project.directory}</span>
              <span className="home-wf-repo-chip home-wf-repo-entry" data-wf-node={index} style={place(app.entry, scene.box)}>index.css</span>
              <span className="home-wf-repo-chip home-wf-repo-file" data-wf-node={index} style={{ ...place(app.file, scene.box), '--home-wf-primary': project.primary } as CSSProperties}>
                <span className="home-wf-repo-file-name">{project.file}</span>
                <code className="home-wf-repo-class">
                  <span className="home-wf-repo-swatch" />
                  {workflowProjectClass}
                  <svg className="home-wf-repo-cursor" height="18" viewBox="0 0 24 24" width="18">
                    <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" />
                  </svg>
                </code>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RepoPlate({ shape }: { shape: Slab }) {
  return (
    <g className={clsx('home-wf-plate')}>
      <polygon className="home-wf-plate-shadow" filter="url(#home-wf-repo-blur)" points={shape.shadow} />
      <polygon className="home-wf-plate-front" fill="url(#home-wf-repo-front)" points={shape.front} />
      <polygon className="home-wf-plate-side" points={shape.side} />
      <polygon className="home-wf-plate-top" fill="url(#home-wf-repo-plate)" points={shape.top} />
      <polygon className="home-wf-plate-sheen" fill="url(#home-wf-repo-sheen)" points={shape.top} />
      <polyline className="home-wf-plate-flank" points={shape.flank} />
      <polyline className="home-wf-plate-rim" points={shape.rim} />
    </g>
  )
}
