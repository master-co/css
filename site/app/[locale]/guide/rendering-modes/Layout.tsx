import Tabs, { Tab } from 'internal/components/Tabs'
import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'
import { createTranslation } from 'internal/utils/i18n'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            toc={props.toc}
        >
            <p className='text:18 max-w:screen-sm text:20@sm'>It&#39;s flexible — can be runtime, zero-runtime, or even hybrid.</p>
            {!props.hideTabs && <Tabs className="mb:8x">
                <Tab href='/guide/rendering-modes'>{$('Compare')}</Tab>
                <Tab href='/guide/rendering-modes/progressive-rendering'>{$('Progressive Rendering')} 🚧</Tab>
                <Tab href='/guide/rendering-modes/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/guide/rendering-modes/static-extraction'>{$('Static Extraction')} 🚧</Tab>
            </Tabs>}
            {props.children}
        </DocLayout >
    )
}