import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { workflowRouteDefinitions, workflowRouteReferences, workflowRoutes } from './workflow-content'

/** Which routes use each definition, as a `data-trace` word list of route indexes. */
const definitionTraces = workflowRouteDefinitions.map(({ name }) => workflowRoutes
  .map((route, index) => workflowRouteReferences(route.code).includes(name) ? index : -1)
  .filter((index) => index >= 0)
  .join(' '))

/** A route stylesheet line with each project definition it references marked. */
function CodeLine({ line }: { line: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of line.matchAll(/--[\w-]+/g)) {
    if (!workflowRouteDefinitions.some((definition) => definition.name === match[0])) continue
    parts.push(line.slice(last, match.index))
    parts.push(<span className="home-wf-routes-ref" key={match.index}>{match[0]}</span>)
    last = match.index + match[0].length
  }
  parts.push(line.slice(last))
  return <span className="home-wf-routes-line">{parts}</span>
}

/**
 * Route stylesheets as a deck of sheets over the project manifest, a slab in the section's oblique
 * projection with `index.css` on its front edge. The definitions stand on the slab; the ones the
 * chosen sheet uses turn to ink and send a gold signal up into it. The sheet's code shows how each is used.
 */
export default function WorkflowRoutes() {
  const $ = useTranslation()
  return (
    <div className="home-wf-figure home-wf-routes" data-wf="routes">
      <div className="home-wf-routes-drawing">
      {/* The page's segmented control, at a small size; radios, so the deck follows the choice before hydration. */}
      <div aria-label={$('Route')} className="home-segmented-control home-wf-routes-tabs" role="radiogroup">
        {workflowRoutes.map(({ route }, index) => (
          <label className="home-segmented-control-option home-wf-routes-tab" key={route}>
            <input className="home-wf-routes-input" defaultChecked={index === 0} name="home-wf-route" type="radio" value={index} />
            {route}
          </label>
        ))}
      </div>
      <div aria-hidden="true" className="home-wf-routes-deck">
        {workflowRoutes.map(({ route, code }, index) => (
          <div className="home-wf-routes-sheet" data-sheet={index} key={route} style={{ '--home-wf-sheet': index } as CSSProperties}>
            <code className="home-wf-routes-code">
              {code.split('\n').map((line, number) => <CodeLine key={number} line={line} />)}
            </code>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="home-wf-routes-floor">
        <span className="home-wf-routes-slab" />
        <span className="home-wf-routes-edge">index.css</span>
        <div className="home-wf-routes-defs">
          {workflowRouteDefinitions.map(({ name }, index) => (
            <span className="home-wf-routes-def" data-trace={definitionTraces[index]} key={name} style={{ '--home-wf-row': index } as CSSProperties}>{name}</span>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
