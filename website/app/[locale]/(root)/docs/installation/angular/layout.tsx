import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import brands from 'websites/data/brands'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Angular',
                description: 'Guide to setting up Master CSS in your Angular project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            brand={brands.find(({ name }) => name === 'Angular')}

        >
            <Tabs className="mb:8x">
                <Tab href='/docs/installation/angular'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/angular/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/angular/static-extraction' disabled>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}