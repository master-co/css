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
                title: 'Set up Master CSS in Laravel',
                description: 'Guide to setting up Master CSS in your Laravel project.',
                category: 'Integrations'
            }}
            backOnClickCategory='/guide/installation/integrations'
            brand={brands.find(({ name }) => name === 'Laravel')}

        >
            <Tabs className="mb:8x">
                <Tab href='/guide/installation/laravel'>{$('Runtime Rendering')}</Tab>
                <Tab href='/guide/installation/laravel/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}