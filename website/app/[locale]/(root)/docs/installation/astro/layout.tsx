import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import brands from 'websites/data/brands'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Astro',
                description: 'Guide to setting up Master CSS in your Astro project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            brand={brands.find(({ name }) => name === 'Astro')}
            titleBig
        >
            <Tabs className="mb:8x">
                {/* <Tab href='/docs/installation/astro'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab> */}
                <Tab href='/docs/installation/astro'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/astro/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}