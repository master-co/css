import CodeTabBar from './CodeTabBar'
import clsx from 'clsx'
import { CodeTab } from './CodeTabs'
import { useId } from 'react'

/**
 * Every panel is rendered; the first is shown. `docs-shell/scripts/code` switches
 * tabs, and a storage key restores and shares the choice across tab sets.
 */
export default function CodeTabsView(props: { children: CodeTab[], tabbarClassName?: string, showControls?: boolean, className?: string, localStorageKey?: string }) {
  const idPrefix = useId()
  const current = props.children[0]
  return (
    <div
      className={clsx('display:flex flex-direction:column margin-top:1.25rem codeTabs', props.className)}
      data-code-tabs=""
      data-code-tabs-current-name={current.name}
      data-code-tabs-storage-key={props.localStorageKey}
    >
      <CodeTabBar
        className={props.tabbarClassName}
        showControls={props.showControls}
        currentName={current.name}
        tabs={props.children}
        idPrefix={idPrefix} />
      {props.children.map((tab, index) => (
        <div
          className={clsx('code', { 'display:none': index !== 0 })}
          role="tabpanel"
          id={`${idPrefix}-panel-${index}`}
          aria-labelledby={`${idPrefix}-tab-${index}`}
          tabIndex={0}
          data-code-tabs-panel-name={tab.name}
          hidden={index !== 0}
          key={tab.name}
        >
          <div className="code-panel-label">{tab.name}</div>
          {tab.highlightedCode}
        </div>
      ))}
    </div>
  )
}
