import Tabs, { Tab, TabBadge } from 'internal/components/Tabs'
import { createTranslation } from 'internal/utils/i18n'
import DocLayout from 'internal/layouts/doc'
import brands from 'internal/data/brands'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Vite',
                description: 'Guide to setting up Master CSS in your Vite project.',
                category: 'Integrations'
            }}
            backOnClickCategory='/guide/installation/integrations'
            brand={brands.find(({ name }) => name === 'Vite')}

        >
            <Tabs className="mb:8x">
                <Tab href='/guide/installation/vite'>{$('Runtime Rendering')}</Tab>
                <Tab href='/guide/installation/vite/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}