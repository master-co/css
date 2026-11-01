import CodeCopyButton from './CodeCopyButton'

type Tab = { name?: string, lang: string, ext?: string }

type Props = {
  tabs: Tab[]
  currentName?: string
  className?: string
  /** Accepted for older callers; the bar names the file and nothing else. */
  showControls?: boolean
  copyable?: boolean
  /** Tab lists switch panels through `docs-shell/scripts/code`. */
  idPrefix?: string
}

/** The `ui-code-bar`: the file's name, or `ui-tabs` that switch panels, and the copy action. */
export default function CodeTabBar({ tabs, currentName, className, copyable = true, idPrefix }: Props) {
  return <div className={className ? `ui-code-bar ${className}` : 'ui-code-bar'}>
    {idPrefix
      ? <div className="ui-tabs" role="tablist" aria-label="Code examples">
        {tabs.map(({ name, lang }, index) => {
          const tabName = name ?? lang
          const active = currentName === tabName
          return <button
            key={tabName}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${index}`}
            aria-controls={`${idPrefix}-panel-${index}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-code-tabs-tab-name={tabName}
          >
            {tabName}
          </button>
        })}
      </div>
      : <span className="ui-code-file">{tabs[0]?.name}</span>}
    {copyable && <CodeCopyButton name={currentName} />}
  </div>
}
