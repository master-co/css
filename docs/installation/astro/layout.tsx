import Tabs, { Tab, TabBadge } from 'shared/components/Tabs'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import NuxtjsSvg from 'shared/images/frameworks/astro.svg'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Astro',
                description: 'Guide to setting up Master CSS in your Astro project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={{
                Element: NuxtjsSvg,
                class: 'w:105'
            }}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/astro'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/astro/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/astro/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}