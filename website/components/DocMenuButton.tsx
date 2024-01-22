'use client'

import { useState } from 'react'
import MenuButton from 'websites/components/MenuButton'
import links from '../links'
import Link from 'websites/components/Link'
import Portal from 'websites/components/Portal'
import clsx from 'clsx'
import { IconArrowUpRight, IconBrandDiscord, IconBrandGithub, IconBrandX, IconChevronRight, IconLanguage, IconMessages, IconSelector, IconVersions } from '@tabler/icons-react'
import ThemeSelect from 'websites/components/ThemeSelect'
import ThemeIcon from 'websites/components/ThemeIcon'
import { useThemeService } from '@master/css.react'
import DocVersionSelect from './DocVersionSelect'
import version from '~/version'
import LanguageSelect from 'websites/components/LanguageSelect'
import { getDictionary } from 'websites/dictionaries'
import { useLocale } from 'websites/contexts/locale'
import i18n from '~/i18n.config.mjs'

export default function DocMenuButton(props: any) {
    const [opened, setOpened] = useState(false)
    const themeService = useThemeService()
    const locale = useLocale()
    const $ = getDictionary(props.locale)
    return (
        <>
            <MenuButton {...props} opened={opened} onClick={() => setOpened(!opened)} />
            {opened &&
                <Portal>
                    <div className="fixed @fade|.3s bd:blur(25) bg:base/.9 bottom:0 overflow-y:auto overscroll-behavior:contain pb:80 pt:20 top:49 top:61@md w:full z:1050">
                        {links.map(({ Icon, disabled, fullName, ...eachLink }: any) =>
                            <Link className={clsx('flex ai:center w:full', { 'fg:lightest': disabled })} {...eachLink} disabled={disabled} key={eachLink.name} onClick={!disabled && (() => setOpened(false))}>
                                <Icon className={clsx('fill:text-lightest/.2 ml:20 mr:12', disabled ? 'fg:lightest' : 'fg:light')} stroke="1" width="26" height="26" />
                                <div className={clsx('flex ai:center bb:1|frame flex:1 h:48', { 'fg:strong': !disabled })}>
                                    {$(fullName || eachLink.name)}
                                    {!disabled && <IconChevronRight className="fg:lightest ml:auto mr:12" stroke="1.3" />}
                                </div>
                            </Link>
                        )}
                        <div className='font:14 m:40|20|10|20'>{$('Community')}</div>
                        <Link className="flex ai:center w:full" href="https://github.com/master-co/css" onClick={() => setOpened(false)}>
                            <IconBrandGithub className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                GitHub
                                <IconArrowUpRight className="fg:lightest ml:auto mr:12" stroke="1.3" />
                            </div>
                        </Link>
                        <Link className="flex ai:center w:full" href="https://github.com/master-co/css/discussions" onClick={() => setOpened(false)}>
                            <IconMessages className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                {$('Discussions')}
                                <IconArrowUpRight className="fg:lightest ml:auto mr:12" stroke="1.3" />
                            </div>
                        </Link>
                        <Link className="flex ai:center w:full" href="https://discord.com/invite/sZNKpAAAw6" onClick={() => setOpened(false)}>
                            <IconBrandDiscord className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                Discord
                                <IconArrowUpRight className="fg:lightest ml:auto mr:12" stroke="1.3" />
                            </div>
                        </Link>
                        <Link className="flex ai:center w:full" href="https://twitter.com/mastercorg" onClick={() => setOpened(false)}>
                            <IconBrandX className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                Twitter
                                <IconArrowUpRight className="fg:lightest ml:auto mr:12" stroke="1.3" />
                            </div>
                        </Link>
                        <div className='font:14 m:40|20|10|20'>{$('System')}</div>
                        <label className="flex ai:center w:full">
                            <IconVersions className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                {$('Version')}
                                <div className='flex rel ai:center ml:auto'>
                                    <div className="capitalize fg:light ml:auto mr:12">{version}</div>
                                    <DocVersionSelect version={version} />
                                    <IconSelector className="fg:lightest mr:12" stroke="1.3" />
                                </div>
                            </div>
                        </label>
                        <label className="flex ai:center w:full">
                            <IconLanguage className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                {$('Language')}
                                <div className='flex rel ai:center ml:auto'>
                                    <LanguageSelect>
                                        <div className="capitalize fg:light ml:auto mr:12">{i18n.nameOfLocale[locale as keyof typeof i18n.nameOfLocale]}</div>
                                    </LanguageSelect>
                                    <IconSelector className="fg:lightest mr:12" stroke="1.3" />
                                </div>
                            </div>
                        </label>
                        <label className="flex ai:center w:full">
                            <ThemeIcon className="fg:light fill:text-lightest/.2 ml:20 mr:12" stroke="1" width="26" height="26" />
                            <div className="flex ai:center bb:1|frame fg:strong flex:1 h:48">
                                {$('Theme')}
                                <div className='flex rel ai:center ml:auto'>
                                    <div className="capitalize fg:light ml:auto mr:12">{themeService?.value}</div>
                                    <ThemeSelect />
                                    <IconSelector className="fg:lightest mr:12" stroke="1.3" />
                                </div>
                            </div>
                        </label>
                    </div>
                </Portal>
            }
        </>
    )
}