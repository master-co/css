import Tabs, { Tab } from 'websites/components/Tabs'
import { getTranslation } from '~/i18n'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/build-tools/webpack.svg?inlineSvg'

export default async function Layout(props: any) {
    const $ = await getTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Set up Master CSS in Webpack',
                description: 'Guide to setting up Master CSS in your Webpack project.',
                category: 'Installation'
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={100} />}
            titleBig
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation/webpack'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/installation/webpack/static-extraction'>{$('Static Extraction')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}