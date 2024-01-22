import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { getTranslation } from '~/i18n'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/frameworks/vuejs.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await getTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Vue.js',
                description: 'Guide to setting up Master CSS in your Vue.js project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={64} />}
            titleBig
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/vuejs'>{$('Progressive Rendering')}</Tab>
                <Tab href='/docs/installation/vuejs/runtime-rendering'>{$('Runtime Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/vuejs/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}