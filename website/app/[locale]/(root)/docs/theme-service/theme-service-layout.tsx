import Tabs, { Tab } from 'websites/components/Tabs'
import DocLayout from '~/layouts/reference'
import metadata from './metadata'
import { createTranslation } from '~/i18n'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata}>
            <Tabs className="mb:8x">
                <Tab href='/docs/theme-service'>{$('Main')}</Tab>
                <Tab href='/docs/theme-service/react'>{$('React')}</Tab>
                <Tab href='/docs/theme-service/svelte' disabled>{$('Svelte')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}