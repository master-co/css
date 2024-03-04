import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import brands from 'websites/data/brands'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Next.js',
                description: 'Guide to setting up Master CSS in your Next.js project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            brand={brands.find(({ name }) => name === 'Next.js')}

        >
            <Tabs className="mb:8x">
                <Tab href='/docs/installation/nextjs'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/nextjs/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/nextjs/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}