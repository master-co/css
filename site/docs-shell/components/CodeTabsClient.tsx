'use client'

import CodeTabBar from './CodeTabBar'
import clsx from 'clsx'
import { CodeTab } from './CodeTabs'
import { Dispatch, SetStateAction, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocalStorage } from '../uses/use-local-storage'

type CodeTabsClientProps = {
  children: CodeTab[]
  tabbarClassName?: string
  showControls?: boolean
  className?: string
  localStorageKey?: string
}

const emptySubscribe = () => () => undefined

function getFirstTabName(tabs: CodeTab[]) {
  return tabs[0]?.name
}

function getStoredTabName(storageKey: string, tabs: CodeTab[]) {
  const firstTabName = getFirstTabName(tabs)

  if (typeof window === 'undefined') {
    return firstTabName
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return firstTabName

    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string' && tabs.some((tab) => tab.name === parsed)) {
      return parsed
    }
  } catch {
    return firstTabName
  }

  return firstTabName
}

function useIsHydrating() {
  return useSyncExternalStore(emptySubscribe, () => false, () => true)
}

const CodeTabsClient = (props: { children: CodeTab[], tabbarClassName?: string, showControls?: boolean, className?: string, localStorageKey?: string }) => {
  if (props.localStorageKey) {
    return <PersistedCodeTabsClient {...props} localStorageKey={props.localStorageKey} />
  }

  return <UncontrolledCodeTabsClient {...props} />
}

function PersistedCodeTabsClient(props: CodeTabsClientProps & { localStorageKey: string }) {
  const isHydrating = useIsHydrating()
  const initialName = useMemo(() => isHydrating ? getFirstTabName(props.children) : getStoredTabName(props.localStorageKey, props.children), [isHydrating, props.children, props.localStorageKey])
  const [name, setName] = useLocalStorage(props.localStorageKey, initialName, { initializeWithValue: !isHydrating })

  return (
    <CodeTabsFrame
      {...props}
      name={name}
      renderAllPanels
      setName={setName}
    />
  )
}

function UncontrolledCodeTabsClient(props: CodeTabsClientProps) {
  const [name, setName] = useState(getFirstTabName(props.children))

  return (
    <CodeTabsFrame
      {...props}
      name={name}
      setName={setName}
    />
  )
}

function CodeTabsFrame(props: CodeTabsClientProps & {
  name?: string
  renderAllPanels?: boolean
  setName: Dispatch<SetStateAction<string | undefined>>
}) {
  const current = useMemo(() => {
    const tab = props.children.find((child: any) => child.name === props.name)
    if (!tab) return props.children[0]
    return tab
  }, [props.name, props.children])
  return (
    <div
      className={clsx('flex flex-col mt:5x {my:0;flex:1}_.code {bt:0px!;rtl:0px;rtr:0px}_pre codeTabs', props.className)}
      data-code-tabs-current-name={current.name}
      data-code-tabs-storage-key={props.localStorageKey}
      suppressHydrationWarning={Boolean(props.localStorageKey)}
    >
      <CodeTabBar
        {...props}
        className={props.tabbarClassName}
        currentName={current.name}
        currentCode={current.code}
        tabs={props.children}
        onTabChange={(event: Event, name: string) => {
          const tab = props.children.find((child: any) => child.name === name)
          if (!tab) throw new Error(`Tab ${name} not found`)
          props.setName(tab.name)
        }} />
      {
        props.renderAllPanels
          ? props.children.map((tab) => (
            <div
              className={clsx('code', { 'hidden': current.name !== tab.name })}
              data-code-tabs-panel-name={tab.name}
              hidden={current.name !== tab.name}
              key={tab.name}
              suppressHydrationWarning
            >
              {tab.highlightedCode}
            </div>
          ))
          : <div className={clsx('code')} key={current.name}>
            {current.highlightedCode}
          </div>
      }
    </div>
  )
}

export default CodeTabsClient
