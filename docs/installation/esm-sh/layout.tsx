import Tabs, { Tab, TabBadge } from 'shared/components/Tabs'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import LogoSvg from 'shared/images/cdns/esm-sh.svg'
import metadata from './metadata';

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props}
            metadata={{
                title: 'Launch Master CSS using esm.sh',
                description: metadata.description,
                category: 'CDN'
            }}
            backOnClickCategory='/docs/installation/cdn'
            icon={{
                Element: LogoSvg,
                class: 'w:64'
            }}
        >
            {props.children}
        </DocLayout >
    )
}