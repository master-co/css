import Tabs, { Tab } from 'shared/components/Tabs'
import { queryDictionary } from 'shared/dictionaries';
import DocLayout from '~/layouts/doc'
import metadata from './metadata';
import ESLintSvg from 'shared/icons/eslint.svg'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        /* @ts-expect-error server component */
        <DocLayout {...props} metadata={metadata} icon={{
            Element: ESLintSvg,
            class: 'w:90'
        }}>
            <Tabs className="mb:30">
                <Tab href='/docs/code-linting/react'>React</Tab>
                <Tab href='/docs/code-linting/vuejs'>Vue.js</Tab>
                <Tab href='/docs/code-linting/html'>HTML</Tab>
            </Tabs>
            {props.children}
        </DocLayout >
    )
}