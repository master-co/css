import Tabs, { Tab } from 'internal/components/Tabs'
import { createTranslation } from 'internal/utils/i18n'
import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'
import Footer from './footer.mdx'

import pageCategories from '~/site/.categories/guide.json'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props} pageCategories={pageCategories} pageDirname={__dirname} metadata={metadata}>
            <p className='italic'>No-install CDN, framework integrations, or a standalone CLI — it&apos;s your choice.</p>
            <Tabs className="mb:8x">
                <Tab href='/guide/installation'>{$('Quick Start')}</Tab>
                <Tab href='/guide/installation/cli'>{$('Standalone CLI')}</Tab>
                <Tab href='/guide/installation/cdn'>{$('Runtime CDN')}</Tab>
                <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
                {/* <Tab href='/guide/installation/download' disabled>{$('Download')}</Tab> */}
            </Tabs>
            {props.children}
            <Footer />
        </DocLayout >
    )
}