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
import { collectDictionary, queryDictionary } from 'websites/dictionaries'
import version from '~/version'
import Link from 'websites/components/Link'
import DocMenuButton from './DocMenuButton'
import docMenuDict from './docMenuDict'
import SearchButton from 'websites/components/SearchButton'

export default async function DocHeader({ children, ...props }: any) {
    const $ = await queryDictionary(props.locale)
    return (
        <Header {...props} >
            {/* <SearchButton locale={props.locale} dict={await collectDictionary(props.locale, ['Searching …', 'Search ⌘ K …'])} /> */}
            <Link href={'/'} className="mx:auto@<md">
                {<Logotype height="19" />}
            </Link>
            <label className='app-header-nav hide@<md rel gap:5 ml:30'>
                v{version}
                <DocVersionSelect version={version} />
                <IconChevronDown className="1emx1em mr:-3 stroke:1.5" />
            </label>
            {links.map(({ Icon, fullName, ...eachLink }: any) => <HeaderNav className="hide@<md" key={eachLink.name} {...eachLink}>{$(eachLink.name)}</HeaderNav>)}
            <DiscussionsIconButton className="app-header-icon hide@<md ml:auto" projectId="css" />
            <GitHubIconButton className="app-header-icon hide@<md" projectId="css" />
            <DiscordIconButton className="app-header-icon hide@<md" />
            <TwitterIconButton className="app-header-icon hide@<md" />
            <LanguageButton className="app-header-icon hide@<md" locale={props.locale} />
            <ThemeButton className="app-header-icon hide@<md mr:-12" />
            <DocMenuButton className="app-header-icon hide@md mr:-20" locale={props.locale} dict={await collectDictionary(props.locale, docMenuDict)} />
        </Header>
    )
}