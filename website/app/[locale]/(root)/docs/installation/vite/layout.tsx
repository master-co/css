import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/build-tools/vite.svg?inlineSvg'

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Vite',
                description: 'Guide to setting up Master CSS in your Vite project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={72} />}
            titleBig
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/vite'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/vite/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}