import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import SvelteSvg from '~/public/images/frameworks/svelte.svg?inlineSvg'

export const metadata = {
    title: 'Set up Master CSS in Svelte',
    description: 'Guide to setting up Master CSS in your Svelte project.',
    category: 'Installation'
}

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            backOnClickCategory='/docs/installation'
            icon={{
                Element: SvelteSvg,
                class: 'w:64'
            }}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/svelte'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/svelte/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/svelte/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}