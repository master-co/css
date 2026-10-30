import type { ReactNode } from 'react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { workflowRouteDefinitions, workflowRoutes } from './workflow-content'
import WorkflowCanvas from './WorkflowCanvas'

/** Keep the actual stylesheet selectable; Canvas supplies only its floating paper and connections. */
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

export default function WorkflowRoutes() {
  const $ = useTranslation()
  return (
    <div className="home-wf-figure home-wf-routes" data-wf="routes">
      <div aria-label={$('Route')} className="home-segmented-control home-wf-routes-tabs" role="radiogroup">
        {workflowRoutes.map(({ route }, index) => (
          <label className="home-segmented-control-option home-wf-routes-tab" key={route}>
            <input className="home-wf-routes-input" defaultChecked={index === 0} name="home-wf-route" type="radio" value={index} />
            {route}
          </label>
        ))}
      </div>
      <div className="home-wf-routes-stage home-wf-scene">
        <div className="home-wf-anchor home-wf-routes-paper" data-wf-anchor="route-sheet">
          {workflowRoutes.map(({ route, code }, index) => (
            <div className="home-wf-routes-sheet" data-sheet={index} key={route}>
              <span className="home-wf-routes-filename">{route === '/' ? 'index' : route.slice(1)}.css</span>
              {/* Keyboard readers need a focus target for this native overflow region. */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <div aria-label={`${route} CSS`} className="home-wf-routes-code" role="region" tabIndex={0}>
                <code>{code.split('\n').map((line, number) => <CodeLine key={number} line={line} />)}</code>
              </div>
            </div>
          ))}
        </div>
        <div className="home-wf-routes-defs">
          {workflowRouteDefinitions.map(({ name }, index) => (
            <span className="home-wf-anchor home-wf-routes-def" data-wf-anchor={`definition-${index}`} key={name}>{name}</span>
          ))}
        </div>
        <WorkflowCanvas figure="routes" />
      </div>
    </div>
  )
}
