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
            <p className='italic'>With no-install CDN, framework integrations, or standalone CLI — your call.</p>
            <Tabs className="mb:8x">
                <Tab href='/guide/installation'>{$('Manual')}</Tab>
                <Tab href='/guide/installation/cdn'>{$('Runtime CDN')}</Tab>
                <Tab href='/guide/installation/cli'>{$('CLI')}</Tab>
                <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
                {/* <Tab href='/guide/installation/download' disabled>{$('Download')}</Tab> */}
            </Tabs>
            {props.children}
            <Footer />
        </DocLayout >
    )
}