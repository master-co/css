import Tabs, { Tab } from 'shared/components/Tabs'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import metadata from './metadata';

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props} metadata={metadata}>
            <Tabs className="mb:30">
                <Tab href='/docs/theme-service'>{$('Main')}</Tab>
                <Tab href='/docs/theme-service/react'>{$('React')}</Tab>
                <Tab href='/docs/theme-service/svelte' disabled>{$('Svelte')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}