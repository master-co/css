import Tabs, { Tab } from 'websites/components/Tabs'
import { queryDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    const $ = await queryDictionary(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            toc={props.toc}
        >
            <p className='text:18 max-w:800'>It&#39;s flexible — can be runtime, zero-runtime, or even both.</p>
            {!props.hideTabs && <Tabs className="mb:30">
                <Tab href='/docs/rendering-modes'>{$('Compare')}</Tab>
                <Tab href='/docs/rendering-modes/progressive-rendering'>{$('Progressive Rendering')} 🚧</Tab>
                <Tab href='/docs/rendering-modes/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/rendering-modes/static-extraction'>{$('Static Extraction')} 🚧</Tab>
            </Tabs>}
            {props.children}
        </DocLayout >
    )
}