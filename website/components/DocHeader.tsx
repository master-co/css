'use client'

import links from '../links'
import Header from 'websites/components/Header'
import HeaderNav from 'websites/components/HeaderNav'
import LanguageButton from 'websites/components/LanguageButton'
import GitHubIconButton from 'websites/components/GitHubIconButton'
import ThemeButton from 'websites/components/ThemeButton'
import TwitterIconButton from 'websites/components/TwitterIconButton'
import DiscussionsIconButton from 'websites/components/DiscussionsIconButton'
import DiscordIconButton from 'websites/components/DiscordIconButton'
import { IconChevronDown } from '@tabler/icons-react'
import { Logotype } from '~/components/Logotype'
import DocVersionSelect from './DocVersionSelect'
import version from '~/version'
import Link from 'websites/components/Link'
import DocMenuButton from './DocMenuButton'
import { useTranslation } from 'websites/contexts/i18n'

export default function DocHeader({ children, ...props }: any) {
    const $ = useTranslation()
    return (
        <Header {...props} >
            <Link href={'/'} className="mx:auto@<md">
                {<Logotype height="19" />}
            </Link>
            <label className='app-header-nav hide@<md rel gap:5 ml:30'>
                v{version}
                <DocVersionSelect version={version} />
                <IconChevronDown className="mr:-3 size:1em stroke:1.5" />
            </label>
            {links.map(({ Icon, fullName, ...eachLink }: any) => <HeaderNav className="hide@<md" key={eachLink.name} {...eachLink}>{$(eachLink.name)}</HeaderNav>)}
            <TwitterIconButton className="app-header-icon hide@<md ml:auto" />
            <DiscordIconButton className="app-header-icon hide@<md" />
            <DiscussionsIconButton className="app-header-icon hide@<md" projectId="css" />
            <GitHubIconButton className="app-header-icon hide@<md" projectId="css" />
            <div className='hide@<md bg:divider h:1em mx:4x w:1'></div>
            <LanguageButton className="app-header-icon hide@<md" locale={props.locale} />
            <ThemeButton className="app-header-icon hide@<md mr:-12" />
            <DocMenuButton className="app-header-icon hide@md mr:-20" locale={props.locale} />
        </Header>
    )
}