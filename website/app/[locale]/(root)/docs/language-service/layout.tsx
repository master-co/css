import Tabs, { Tab } from 'websites/components/Tabs'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import metadata from './metadata'

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata} titleBig>
            <Tabs className="mb:30">
                <Tab href='/docs/language-service/vscode'>{$('Visual Studio Code')}</Tab>
                <Tab href='/docs/language-service/webstorm' disabled>{$('WebStorm')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}