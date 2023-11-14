import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/frameworks/blazor.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Blazor',
                description: 'Guide to setting up Master CSS in your Blazor project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={{
                Element: LogoSvg,
                class: 'w:72'
            }}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/blazor'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/blazor/static-extraction' disabled>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}