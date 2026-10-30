import type { CSSProperties } from 'react'
import { workflowProjectClass, workflowProjects } from './workflow-content'
import WorkflowCanvas from './WorkflowCanvas'

/** Each app keeps its nearest entry and its own resolution of the same class. */
export default function WorkflowRepo() {
  return (
    <div className="home-wf-figure home-wf-repo" data-active="0" data-wf="repo">
      <div className="home-wf-repo-stage home-wf-scene">
        {workflowProjects.map((project, index) => (
          <div className="home-wf-repo-app" key={project.directory}>
            <span aria-hidden="true" className="home-stone home-stone-quiet home-wf-anchor home-wf-repo-entry" data-wf-anchor={`entry-${index}`}>index.css</span>
            <button
              aria-label={`${project.directory}: ${project.file}, ${workflowProjectClass} → ${project.primary}`}
              aria-pressed={index === 0}
              className="home-wf-anchor home-wf-repo-file"
              data-wf-anchor={`project-${index}`}
              data-wf-pick={index}
              style={{ '--home-wf-primary': project.primary } as CSSProperties}
              type="button">
              <span className="home-wf-repo-directory">{project.directory}</span>
              <span className="home-wf-repo-file-name">{project.file}</span>
              <code className="home-wf-repo-class"><span aria-hidden="true" className="home-wf-repo-swatch" />{workflowProjectClass}</code>
            </button>
          </div>
        ))}
        <span className="home-stone home-stone-quiet home-wf-anchor home-wf-manifest home-wf-repo-root" data-wf-anchor="shared"><code>index.css</code></span>
        <WorkflowCanvas figure="repo" />
      </div>
    </div>
  )
}
