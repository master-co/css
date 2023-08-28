import Tabs, { Tab, TabBadge } from 'shared/components/Tabs'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import LogoSvg from 'shared/images/frameworks/laravel.svg'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Laravel',
                description: 'Guide to setting up Master CSS in your Laravel project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={{
                Element: LogoSvg,
                class: 'w:72'
            }}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/laravel'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/laravel/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}