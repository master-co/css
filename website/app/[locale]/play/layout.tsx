import RootLayout from '../root.layout'
import metadata from './metadata'
import { generate } from '~/utils/metadata'
import Script from 'next/script'
import i18n from '~/i18n.config.mjs'

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Layout({ children, params }: {
    children: JSX.Element,
    params: { locale: typeof i18n['locales'][number] }
}) {
    return (
        <RootLayout locale={params.locale} bodyClassName='bg:base' style={{ display: 'none' }}>
            <>
                <Script src="/monaco-editor/vs/loader.js" strategy="worker" />
                <Script src="/monaco-editor/vs/editor/editor.main.js" strategy="worker" />
                <Script src="/monaco-editor/vs/editor/editor.main.nls.js" strategy="worker" />
                <Script src="/monaco-editor/vs/basic-languages/html/html.js" strategy="worker" />
                <Script src="/monaco-editor/vs/language/html/htmlMode.js" strategy="worker" />
                <Script src="/monaco-editor/vs/language/html/htmlWorker.js" strategy="worker" />
                <Script src="/monaco-editor/vs/basic-languages/javascript/javascript.js" strategy="worker" />
                <Script src="/monaco-editor/vs/language/typescript/tsMode.js" strategy="worker" />
                <Script src="/monaco-editor/vs/base/worker/workerMain.js" strategy="worker" />
                {children}
            </>
        </RootLayout>
    )
}

