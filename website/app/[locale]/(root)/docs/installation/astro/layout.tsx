import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { getTranslation } from '~/i18n'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/frameworks/astro.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await getTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Astro',
                description: 'Guide to setting up Master CSS in your Astro project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={105} />}
            titleBig
        >
            <Tabs className="mb:30">
                {/* <Tab href='/docs/installation/astro'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab> */}
                <Tab href='/docs/installation/astro'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/astro/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}