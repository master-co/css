import Tabs, { Tab } from 'websites/components/Tabs'
import DocLayout from '~/layouts/reference'
import metadata from './metadata'
import { createTranslation } from '~/i18n'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={metadata}
            toc={props.toc}
        >
            <p className='text:18 max-w:screen-sm'>It&#39;s flexible — can be runtime, zero-runtime, or even hybrid.</p>
            {!props.hideTabs && <Tabs className="mb:8x">
                <Tab href='/docs/rendering-modes'>{$('Compare')}</Tab>
                <Tab href='/docs/rendering-modes/progressive-rendering'>{$('Progressive Rendering')} 🚧</Tab>
                <Tab href='/docs/rendering-modes/runtime-rendering'>{$('Runtime Rendering')}</Tab>
                <Tab href='/docs/rendering-modes/static-extraction'>{$('Static Extraction')} 🚧</Tab>
            </Tabs>}
            {props.children}
        </DocLayout >
    )
}