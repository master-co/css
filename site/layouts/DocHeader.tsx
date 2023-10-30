import links from '../links.mjs'
import Header, { HeaderNav } from 'shared/components/Header'
import LanguageButton from 'shared/components/LanguageButton';
import GitHubIconButton from 'shared/components/GitHubIconButton';
import ThemeButton from 'shared/components/ThemeButton';
import TwitterIconButton from 'shared/components/TwitterIconButton';
import DiscussionsIconButton from 'shared/components/DiscussionsIconButton';
import DiscordIconButton from 'shared/components/DiscordIconButton';
import { IconChevronDown } from '@tabler/icons-react';
import project from '~/project';
import { Logotype } from '~/components/Logotype';
import DocVersionSelect from './DocVersionSelect';
import { queryDictionary } from 'shared/dictionaries';

export default async function DocHeader({ children, ...props }: any) {
    const $ = await queryDictionary(props.locale)
    return <Header {...props} Logotype={Logotype} >
        <label className='app-header-nav rel gap:5 ml:30'>
            v{project.version}
            <DocVersionSelect version={project.version} />
            <IconChevronDown className="1emx1em stroke:1.3 mr:-3" />
        </label>
        {links?.map((eachLink: any) => <HeaderNav key={eachLink.name} {...eachLink}>{$(eachLink.name)}</HeaderNav>)}
        <DiscussionsIconButton className="app-header-icon ml:auto" projectId={project.id} />
        <GitHubIconButton className="app-header-icon" projectId={project.id} />
        <TwitterIconButton className="app-header-icon" />
        <DiscordIconButton className="app-header-icon" />
        <LanguageButton className="app-header-icon" locale={props.locale} />
        <ThemeButton className="app-header-icon mr:-12" />
    </Header>
}