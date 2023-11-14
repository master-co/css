import Tabs, { Tab } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
        >
            <Tabs className="mb:30">
                <Tab href='/docs/installation'>{$('Guides')}</Tab>
                <Tab href='/docs/installation/general'>{$('General')}</Tab>
                <Tab href='/docs/installation/cdn'>{$('CDN')}</Tab>
                <Tab href='/docs/installation/download' disabled>{$('Download')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}