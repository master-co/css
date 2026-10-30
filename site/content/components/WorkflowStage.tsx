import type { ComponentType, SVGProps } from 'react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { workflowFrameworks, workflowIntegrations } from './workflow-content'
import WorkflowCanvas from './WorkflowCanvas'

type Brand = { name: string, src: ComponentType<SVGProps<SVGSVGElement>>, className?: string }

/** Canvas draws the assembly; the original brand marks and installation links remain native. */
export default function WorkflowStage() {
  const $ = useTranslation()
  return (
    <div className="home-wf-figure home-wf-stage-figure" data-active="0" data-wf="stage">
      <div className="home-wf-scene home-wf-stage">
        <div className="home-wf-framework-grid">
          {workflowFrameworks.map((framework, index) => {
            const { name, src: Logo, className } = brands[framework.brand] as Brand
            return (
              <Link
                aria-label={$('{name} installation guide').replace('{name}', name)}
                className="home-wf-anchor home-wf-framework"
                data-lit={index === 0 ? '' : undefined}
                data-wf-anchor={`framework-${index}`}
                data-wf-name={name}
                data-wf-pick={index}
                href={`/guide/installation/${framework.guide}`}
                key={framework.brand}
                title={name}>
                <Logo aria-hidden="true" className={clsx('home-wf-framework-logo', className)} height={30} width={30} />
              </Link>
            )
          })}
        </div>
        <div aria-hidden="true" className="home-wf-integration-grid">
          {workflowIntegrations.map(({ key }, index) => (
            <span className="home-wf-anchor home-wf-integration" data-wf-anchor={`integration-${index}`} key={key}>{key}</span>
          ))}
        </div>
        <span className="home-wf-anchor home-wf-manifest" data-wf-anchor="manifest"><span aria-hidden="true" className="home-wf-source-mark">{'{ }'}</span><code>index.css</code></span>
        <WorkflowCanvas figure="stage" />
      </div>
      <p aria-hidden="true" className="home-wf-readout" data-wf-caption="">Vite → @master/css-vite</p>
    </div>
  )
}
