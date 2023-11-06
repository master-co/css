import links from '../links.mjs'
import Header, { HeaderNav } from 'websites/components/Header'
import LanguageButton from 'websites/components/LanguageButton';
import GitHubIconButton from 'websites/components/GitHubIconButton';
import ThemeButton from 'websites/components/ThemeButton';
import TwitterIconButton from 'websites/components/TwitterIconButton';
import DiscussionsIconButton from 'websites/components/DiscussionsIconButton';
import DiscordIconButton from 'websites/components/DiscordIconButton';
import { IconChevronDown } from '@tabler/icons-react';
import project from '~/project';
import { Logotype } from '~/components/Logotype';
import DocVersionSelect from './DocVersionSelect';
import { queryDictionary } from 'websites/dictionaries';
import version from 'websites/version';

export default async function DocHeader({ children, ...props }: any) {
    const $ = await queryDictionary(props.locale)
    return <Header {...props} Logotype={Logotype} >
        <label className='app-header-nav rel gap:5 ml:30'>
            v{version}
            <DocVersionSelect version={version} />
            <IconChevronDown className="1emx1em stroke:1.3 mr:-3" />
        </label>
        {links?.map((eachLink: any) => <HeaderNav key={eachLink.name} {...eachLink}>{$(eachLink.name)}</HeaderNav>)}
        <DiscussionsIconButton className="app-header-icon ml:auto" projectId="css" />
        <GitHubIconButton className="app-header-icon" projectId="css" />
        <TwitterIconButton className="app-header-icon" />
        <DiscordIconButton className="app-header-icon" />
        <LanguageButton className="app-header-icon" locale={props.locale} />
        <ThemeButton className="app-header-icon mr:-12" />
    </Header>
}