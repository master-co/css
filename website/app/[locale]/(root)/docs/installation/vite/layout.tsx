import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/build-tools/vite.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Vite',
                description: 'Guide to setting up Master CSS in your Vite project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={{
                Element: LogoSvg,
                class: 'w:72'
            }}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/vite'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/vite/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}