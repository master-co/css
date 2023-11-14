import Tabs, { Tab } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata}>
            <Tabs className="mb:30">
                <Tab href='/docs/language-service/vscode'>{$('Visual Studio Code')}</Tab>
                <Tab href='/docs/language-service/webstorm' disabled>{$('WebStorm')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}