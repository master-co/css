import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import LogoSvg from '~/public/images/build-tools/vite.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
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
            <Tabs className="mb:8x">
                <Tab href='/docs/installation/vite'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/vite/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}