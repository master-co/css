import clsx from 'clsx'
import WindowControls from './WindowControls'
import FileIcon from './FileIcon'
import CodeCopyButton from './CodeCopyButton'

type Tab = { name?: string, lang: string, ext?: string }

type Props = {
  tabs: Tab[]
  currentName?: string
  className?: string
  showControls?: boolean
  copyable?: boolean
  /** Tab lists switch panels through `docs-shell/scripts/code`. */
  idPrefix?: string
}

export default function CodeTabBar({ tabs, currentName, className, showControls, copyable = true, idPrefix }: Props) {
  return <div className={clsx('code-bar', className)}>
    {showControls && <div className="code-window-controls" aria-hidden="true"><WindowControls /></div>}
    {idPrefix
      ? <div className="code-bar-tabs" role="tablist" aria-label="Code examples">
        {tabs.map(({ name, lang, ext }, index) => {
          const tabName = name ?? lang
          const active = currentName === tabName
          return <button
            key={tabName}
            type="button"
            className="code-tab"
            role="tab"
            id={`${idPrefix}-tab-${index}`}
            aria-controls={`${idPrefix}-panel-${index}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-code-tabs-tab-name={tabName}
          >
            <FileIcon name={tabName} lang={lang} ext={ext} className="code-tab-icon" />
            <span>{tabName}</span>
          </button>
        })}
      </div>
      : <div className="code-file-label">
        <FileIcon name={tabs[0]?.name ?? tabs[0]?.lang ?? ''} lang={tabs[0]?.lang} ext={tabs[0]?.ext} className="code-tab-icon" />
        <span>{tabs[0]?.name}</span>
      </div>}
    {copyable && <div className="code-bar-actions"><CodeCopyButton name={currentName} /></div>}
  </div>
}
