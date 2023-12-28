import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/frameworks/blazor.svg?inlineSvg'

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Blazor',
                description: 'Guide to setting up Master CSS in your Blazor project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={72} />}
            titleBig
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/blazor'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/blazor/static-extraction' disabled>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}