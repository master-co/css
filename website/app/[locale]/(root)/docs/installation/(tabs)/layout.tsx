import Tabs, { Tab } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import metadata from './metadata'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata} titleBig>
            <Tabs className="mb:8x">
                <Tab href='/docs/installation'>{$('Guides')}</Tab>
                <Tab href='/docs/installation/general'>{$('General')}</Tab>
                <Tab href='/docs/installation/cdn'>{$('CDN')}</Tab>
                <Tab href='/docs/installation/download' disabled>{$('Download')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}