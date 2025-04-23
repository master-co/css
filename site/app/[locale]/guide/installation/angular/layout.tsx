import Tabs, { Tab, TabBadge } from 'internal/components/Tabs'
import { createTranslation } from 'internal/utils/i18n'
import dictionaries from '~/site/dictionaries'
import DocLayout from 'internal/layouts/doc'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = await createTranslation(locale, dictionaries)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Angular',
                description: 'Guide to setting up Master CSS in your Angular project.',
                category: 'Integrations'
            }}
            categoryLink='/guide/installation/integrations'
            brandName='angular'
            dictionaries={dictionaries}
        >
            <Tabs className="mb:8x">
                <Tab href='/guide/installation/angular'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/guide/installation/angular/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/guide/installation/angular/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}