import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import LogoSvg from '~/public/images/frameworks/react.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in React',
                description: 'Guide to setting up Master CSS in your React project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={75} />}
            titleBig
        >
            <Tabs className="mb:8x">
                <Tab href='/docs/installation/react'>{$('Progressive Rendering')}</Tab>
                <Tab href='/docs/installation/react/runtime-rendering'>{$('Runtime Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/docs/installation/react/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}