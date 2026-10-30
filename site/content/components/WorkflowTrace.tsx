import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { workflowTraceChange, workflowTraceNodes } from './workflow-content'
import WorkflowCanvas from './WorkflowCanvas'

/** The graph is a drawing; every node remains a real keyboard-operable button. */
export default function WorkflowTrace() {
  const $ = useTranslation()
  return (
    <div className="home-wf-figure home-wf-trace" data-wf="trace">
      <div aria-label={$('Impact graph')} className="home-wf-scene home-wf-trace-stage" role="group">
        {workflowTraceNodes.map(([, label, kind], index) => (
          <button
            aria-label={kind === 'definition' ? `${label}: ${workflowTraceChange.before} → ${workflowTraceChange.after}` : undefined}
            aria-pressed="false"
            className={clsx('home-wf-anchor home-wf-trace-node', `home-wf-trace-node-${kind}`)}
            data-node={index}
            data-wf-anchor={`node-${index}`}
            data-wf-pick={index}
            key={label}
            type="button">
            {kind === 'definition'
              ? <>
                <span>{label}</span>
                <span aria-hidden="true" className="home-wf-trace-change">
                  <span className="home-wf-trace-swatch" style={{ backgroundColor: workflowTraceChange.before }} />
                  <span className="home-wf-trace-arrow">→</span>
                  <span className="home-wf-trace-swatch" style={{ backgroundColor: workflowTraceChange.after }} />
                </span>
              </>
              : <>
                {kind === 'class' && <span aria-hidden="true" className="home-wf-trace-dot" style={{ '--home-wf-before': workflowTraceChange.before, '--home-wf-after': workflowTraceChange.after } as CSSProperties} />}
                <span>{label}</span>
              </>}
          </button>
        ))}
        <WorkflowCanvas figure="trace" />
      </div>
    </div>
  )
}
