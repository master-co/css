import Tabs, { Tab, TabBadge } from 'internal/components/Tabs'
import { createTranslation } from 'internal/utils/i18n'
import dictionaries from '~/site/dictionaries'
import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'

import pageCategories from '~/site/.categories/guide.json'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = await createTranslation(locale, dictionaries)
    return (
        <DocLayout {...props} pageCategories={pageCategories} pageFileURL={import.meta.url} dictionaries={dictionaries} metadata={metadata}>
            <p className='italic'>Runtime, zero-runtime, or hydration — it’s your call.</p>
            <Tabs className="mb:8x">
                <Tab href='/guide/installation'>{$('Quick Start')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
                <Tab href='/guide/installation/cli'>{$('Standalone CLI')}</Tab>
                <Tab href='/guide/installation/cdn'>{$('Runtime CDN')}</Tab>
                <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
                {/* <Tab href='/guide/installation/download' disabled>{$('Download')}</Tab> */}
            </Tabs>
            {props.children}
        </DocLayout >
    )
}