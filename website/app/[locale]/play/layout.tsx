import { Locale } from 'websites/i18n.config'
import RootLayout from '../root.layout'
import metadata from './metadata'
import { generate } from '~/utils/metadata'

export async function generateMetadata(props: any, parent: any) {
    return generate(metadata, props, parent)
}

export default async function Layout({ children, params }: {
    children: JSX.Element,
    params: { locale: Locale }
}) {
    return (
        <RootLayout locale={params.locale} bodyClassName='bg:base' style={{ display: 'none' }}>
            <>
                <link as="script" rel="preload" href="/monaco-editor/vs/loader.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/editor/editor.main.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/editor/editor.main.nls.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/basic-languages/html/html.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/language/html/htmlMode.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/language/html/htmlWorker.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/basic-languages/javascript/javascript.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/language/typescript/tsMode.js" />
                <link as="script" rel="preload" href="/monaco-editor/vs/base/worker/workerMain.js" />
                {children}
            </>
        </RootLayout>
    )
}

