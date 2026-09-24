'use client'

import CopySvg from '../../public/icons/copy.svg'
import { snackbar } from '../utils/snackbar'
import WindowControls from './WindowControls'
import clsx from 'clsx'
import { useMemo } from 'react'
import FileIcon from './FileIcon'

export default function CodeTabBar({ tabs, onTabChange, currentName, currentCode, className, showControls }: any) {
  const firstActive = useMemo(() => currentName === tabs[0].name, [currentName, tabs])
  return (
    <div className={clsx('code-bar', className)}>
      {showControls && <div data-code-tabs-controls suppressHydrationWarning className={clsx('flex flex:0|0|auto items-center px:0.625rem b:subtle bb:1px br:1px', { 'rbr:lg': firstActive })}>
        <WindowControls />
      </div>}
      {
        tabs.map(({ name, lang, ext }: any, index: number) => {
          const active = currentName === name || tabs.length === 1
          const activeNext = tabs[index + 1]?.name === currentName && tabs.length > 1
          const activePrevious = tabs[index - 1]?.name === currentName
          return (
            <button key={name}
              className={clsx(
                'flex flex:0|0|auto items-center max-w:250px px:sm b-solid b:subtle',
                {
                  'active': active,
                  'active-next': activeNext,
                  'active-previous': activePrevious,
                  'text:strong untouchable rbl:lg+div': active,
                  'bb:1px text:body text:strong:hover': !active,
                  'br:1px rbr:lg': activeNext,
                  'rbl:lg': activePrevious,
                  'bl:1px': currentName !== name && index > 0
                }
              )}
              data-code-tabs-tab-name={name}
              onClick={
                onTabChange
                  ? (event) => onTabChange(event, name)
                  : undefined
              }
              suppressHydrationWarning
              type="button"
            >
              <FileIcon
                name={name}
                lang={lang}
                ext={ext}
                className={clsx('size:14px mb:-0.125rem ml:-1x mr:3xs', { 'active': active, 'hidden': !active })}
                data-code-tabs-icon-name={name}
                suppressHydrationWarning
              />
              <div className={clsx('block! line-clamp:1 flex:1 white-space:nowrap')}>{name}</div>
            </button>
          )
        })
      }
      <div className="flex flex:1 items-center justify-end px:sm bb:1px|solid|subtle bl:1px|solid|subtle">
        <CopySvg width="12" height="12" viewBox="0 0 24 24"
          strokeWidth="1.2"
          className="mr:-0.313rem cursor:pointer fg:slate-60:not(:hover)@light text:muted:not(:hover)@dark"
          onClick={() => {
            snackbar('Copied' + (currentName ? ` <b>${currentName}</b>` : ''))
            navigator.clipboard.writeText(currentCode)
          }}
        />
      </div>
    </div>
  )
}
