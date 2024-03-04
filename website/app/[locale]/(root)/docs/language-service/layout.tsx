import Tabs, { Tab } from 'websites/components/Tabs'
import DocLayout from '~/layouts/reference'
import metadata from './metadata'
import { createTranslation } from '~/i18n'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props} metadata={metadata}>
            <Tabs className="mb:8x">
                <Tab href='/docs/language-service/vscode'>{$('Visual Studio Code')}</Tab>
                <Tab href='/docs/language-service/webstorm' disabled>{$('WebStorm')}</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}