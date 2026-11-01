import '~/site/styles/docs-shell/code.css'
import CodeTabBar from './CodeTabBar'
import clsx from 'clsx'
import { CodeTab } from './CodeTabs'
import { useId } from 'react'

/**
 * One `ui-code` panel with `ui-tabs`. Every panel is rendered; the first is shown. `docs-shell/scripts/code` switches
 * tabs, and a storage key restores and shares the choice across tab sets.
 */
export default function CodeTabsView(props: { children: CodeTab[], tabbarClassName?: string, showControls?: boolean, className?: string, localStorageKey?: string }) {
  const idPrefix = useId()
  const current = props.children[0]
  return (
    <div
      className={clsx('ui-code', props.className)}
      data-code-tabs=""
      data-code-tabs-current-name={current.name}
      data-code-tabs-storage-key={props.localStorageKey}
      data-numbers={props.children.some(tab => tab.number) ? '' : undefined}
    >
      <CodeTabBar
        className={props.tabbarClassName}
        currentName={current.name}
        tabs={props.children}
        idPrefix={idPrefix} />
      {props.children.map((tab, index) => (
        <div
          role="tabpanel"
          id={`${idPrefix}-panel-${index}`}
          aria-labelledby={`${idPrefix}-tab-${index}`}
          data-code-tabs-panel-name={tab.name}
          hidden={index !== 0}
          key={tab.name}
        >
          {/* Paper and pages without scripts show every panel under its name. */}
          <span className="ui-code-file" aria-hidden="true">{tab.name}</span>
          {tab.highlightedCode}
        </div>
      ))}
    </div>
  )
}
