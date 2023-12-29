'use client'

import Tabs, { Tab } from 'websites/components/Tabs'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import metadata from './metadata'

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata} titleBig>
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