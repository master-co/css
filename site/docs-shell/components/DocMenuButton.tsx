'use client'

import { useState, Fragment } from 'react'
import MenuButton from './MenuButton'
import Link from './Link'
import Portal from './Portal'
import clsx from 'clsx'
import { IconArrowUpRight, IconChevronRight, IconLanguage, IconSelector, IconVersions } from '@tabler/icons-react'
import ThemeSelect from './ThemeSelect'
import ThemeIcon from './ThemeIcon'
import { useThemeMode } from '@master/theme-mode.react'
import DocVersionSelect from './DocVersionSelect'
import LanguageSelect from './LanguageSelect'
import { useLocale } from '../contexts/locale'
import i18n from '../common/i18n.config.js'
import { useTranslation } from '../contexts/i18n'
import { useApp } from '../contexts/app'

export default function DocMenuButton(props: any) {
  const [opened, setOpened] = useState(false)
  const app = useApp()
  const themeMode = useThemeMode()
  const locale = useLocale()
  const $ = useTranslation()
  return (
    <>
      <MenuButton {...props} opened={opened} onClick={() => setOpened(!opened)} />
      {opened &&
        <Portal>
          <div className="fixed bottom top:49px z:1050 overflow-y:auto w:100% pb:5rem pt:1.25rem surface-raised/.9 backdrop-filter:blur(25px) animation:fade|.3s overscroll-behavior:contain top:61px@md">
            {app.navs.map(({ Icon, disabled, fullName, ...eachLink }: any) =>
              <Fragment key={eachLink.name}>
                <Link className={clsx('flex items-center w:100%', { 'text-disabled': disabled })} {...eachLink} disabled={disabled} onClick={!disabled && (() => setOpened(false))}>
                  <>
                    <Icon className={clsx('ml:1.25rem mr-sm fill-text-disabled/.2', disabled ? 'text-disabled' : 'text-muted')} stroke="1" width="26" height="26" />
                    <div className={clsx('flex flex:1 items-center h:48px bb:1px|solid|var(--color-line-subtle)', { 'text-strong': !disabled })}>
                      {$(fullName || eachLink.name)}
                      {!disabled && <IconChevronRight className="ml:auto mr-sm text-disabled" stroke="1.3" />}
                    </div>
                  </>
                </Link>
              </Fragment>
            )}
            {app.communityNavs?.length
              ? <>
                <div className='m:2.5rem|1.25rem|0.625rem|1.25rem font-sm'>{$('Community')}</div>
                {app.communityNavs.map(({ Icon, disabled, fullName, ...eachLink }: any) =>
                  <Link className={clsx('flex items-center w:100%', { 'text-disabled': disabled })} {...eachLink} disabled={disabled} key={eachLink.name} onClick={!disabled && (() => setOpened(false))}>
                    <>
                      {Icon && <Icon className={clsx('ml:1.25rem mr-sm fill-text-disabled/.2', disabled ? 'text-disabled' : 'text-muted')} stroke="1" width="26" height="26" />}
                      <div className={clsx('flex flex:1 items-center h:48px bb:1px|solid|var(--color-line-subtle)', { 'text-strong': !disabled })}>
                        {$(fullName || eachLink.name)}
                        {!disabled && <IconArrowUpRight className="ml:auto mr-sm text-disabled" stroke="1.3" />}
                      </div>
                    </>
                  </Link>
                )}
              </>
              : null}
            <div className='m:2.5rem|1.25rem|0.625rem|1.25rem font-sm'>{$('System')}</div>
            <label className="flex items-center w:100%">
              <IconVersions className="ml:1.25rem mr-sm text-muted fill-text-disabled/.2" stroke="1" width="26" height="26" />
              <div className="flex flex:1 items-center h:48px bb:1px|solid|var(--color-line-subtle) text-strong">
                {$('Version')}
                <div className='rel flex items-center ml:auto'>
                  <div className="ml:auto mr-sm capitalize text-muted">{process.env.NEXT_PUBLIC_VERSION}</div>
                  <DocVersionSelect />
                  <IconSelector className="mr-sm text-disabled" stroke="1.3" />
                </div>
              </div>
            </label>
            <label className="flex items-center w:100%">
              <IconLanguage className="ml:1.25rem mr-sm text-muted fill-text-disabled/.2" stroke="1" width="26" height="26" />
              <div className="flex flex:1 items-center h:48px bb:1px|solid|var(--color-line-subtle) text-strong">
                {$('Language')}
                <div className='rel flex items-center ml:auto'>
                  <LanguageSelect>
                    <div className="ml:auto mr-sm capitalize text-muted">{i18n.nameOfLocale[locale as keyof typeof i18n.nameOfLocale]}</div>
                  </LanguageSelect>
                  <IconSelector className="mr-sm text-disabled" stroke="1.3" />
                </div>
              </div>
            </label>
            <label className="flex items-center w:100%">
              <ThemeIcon className="ml:1.25rem mr-sm text-muted fill-text-disabled/.2" stroke="1" width="26" height="26" />
              <div className="flex flex:1 items-center h:48px bb:1px|solid|var(--color-line-subtle) text-strong">
                {$('Theme')}
                <div className='rel flex items-center ml:auto'>
                  <div className="ml:auto mr-sm capitalize text-muted">{themeMode.value}</div>
                  <ThemeSelect />
                  <IconSelector className="mr-sm text-disabled" stroke="1.3" />
                </div>
              </div>
            </label>
          </div>
        </Portal>
      }
    </>
  )
}
