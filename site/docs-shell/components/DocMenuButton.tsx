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
          <div className="position:fixed bottom:0 top:49px z-index:1050 overflow-y:auto width:100% padding-bottom:5rem padding-top:1.25rem surface-raised/.9 backdrop-filter:blur(25px) animation:fade|.3s overscroll-behavior:contain top:61px@md">
            {app.navs.map(({ Icon, disabled, fullName, ...eachLink }: any) =>
              <Fragment key={eachLink.name}>
                <Link className={clsx('display:flex align-items:center width:100%', { 'fg-text-disabled': disabled })} {...eachLink} disabled={disabled} onClick={!disabled && (() => setOpened(false))}>
                  <>
                    <Icon className={clsx('mr-sm margin-left:1.25rem fill-text-muted/.2', disabled ? 'fg-text-disabled' : 'fg-text-muted')} stroke="1" width="26" height="26" />
                    <div className={clsx('display:flex flex:1 align-items:center height:48px border-bottom:1px|solid|var(--color-line-subtle)', { 'fg-text-strong': !disabled })}>
                      {$(fullName || eachLink.name)}
                      {!disabled && <IconChevronRight className="mr-sm margin-left:auto fg-text-muted" stroke="1.3" />}
                    </div>
                  </>
                </Link>
              </Fragment>
            )}
            {app.communityNavs?.length
              ? <>
                <div className='margin:2.5rem|1.25rem|0.625rem|1.25rem font-sm'>{$('Community')}</div>
                {app.communityNavs.map(({ Icon, disabled, fullName, ...eachLink }: any) =>
                  <Link className={clsx('display:flex align-items:center width:100%', { 'fg-text-disabled': disabled })} {...eachLink} disabled={disabled} key={eachLink.name} onClick={!disabled && (() => setOpened(false))}>
                    <>
                      {Icon && <Icon className={clsx('mr-sm margin-left:1.25rem fill-text-muted/.2', disabled ? 'fg-text-disabled' : 'fg-text-muted')} stroke="1" width="26" height="26" />}
                      <div className={clsx('display:flex flex:1 align-items:center height:48px border-bottom:1px|solid|var(--color-line-subtle)', { 'fg-text-strong': !disabled })}>
                        {$(fullName || eachLink.name)}
                        {!disabled && <IconArrowUpRight className="mr-sm margin-left:auto fg-text-muted" stroke="1.3" />}
                      </div>
                    </>
                  </Link>
                )}
              </>
              : null}
            <div className='margin:2.5rem|1.25rem|0.625rem|1.25rem font-sm'>{$('System')}</div>
            <label className="display:flex align-items:center width:100%">
              <IconVersions className="mr-sm margin-left:1.25rem fg-text-muted fill-text-muted/.2" stroke="1" width="26" height="26" />
              <div className="display:flex flex:1 align-items:center height:48px border-bottom:1px|solid|var(--color-line-subtle) fg-text-strong">
                {$('Version')}
                <div className='position:relative display:flex align-items:center margin-left:auto'>
                  <div className="mr-sm margin-left:auto text-transform:capitalize fg-text-muted">{process.env.NEXT_PUBLIC_VERSION}</div>
                  <DocVersionSelect />
                  <IconSelector className="mr-sm fg-text-muted" stroke="1.3" />
                </div>
              </div>
            </label>
            <label className="display:flex align-items:center width:100%">
              <IconLanguage className="mr-sm margin-left:1.25rem fg-text-muted fill-text-muted/.2" stroke="1" width="26" height="26" />
              <div className="display:flex flex:1 align-items:center height:48px border-bottom:1px|solid|var(--color-line-subtle) fg-text-strong">
                {$('Language')}
                <div className='position:relative display:flex align-items:center margin-left:auto'>
                  <LanguageSelect>
                    <div className="mr-sm margin-left:auto text-transform:capitalize fg-text-muted">{i18n.nameOfLocale[locale as keyof typeof i18n.nameOfLocale]}</div>
                  </LanguageSelect>
                  <IconSelector className="mr-sm fg-text-muted" stroke="1.3" />
                </div>
              </div>
            </label>
            <label className="display:flex align-items:center width:100%">
              <ThemeIcon className="mr-sm margin-left:1.25rem fg-text-muted fill-text-muted/.2" stroke="1" width="26" height="26" />
              <div className="display:flex flex:1 align-items:center height:48px border-bottom:1px|solid|var(--color-line-subtle) fg-text-strong">
                {$('Theme')}
                <div className='position:relative display:flex align-items:center margin-left:auto'>
                  <div className="mr-sm margin-left:auto text-transform:capitalize fg-text-muted">{themeMode.value}</div>
                  <ThemeSelect />
                  <IconSelector className="mr-sm fg-text-muted" stroke="1.3" />
                </div>
              </div>
            </label>
          </div>
        </Portal>
      }
    </>
  )
}
