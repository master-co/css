import { Locale } from 'websites/i18n.config'
import RootLayout from '../root.layout'
import i18n from 'websites/i18n.config.mjs'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }));
}

export default async function Layout(props: {
    children: JSX.Element,
    params: { locale: Locale }
}) {
    return (
        <RootLayout {...props} bodyAttrs={{ className: 'bg:base' }} style={{ display: 'none' }}>
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
                <link as="style" rel="preload" href="/fonts/fira-code.css" />
                <link as="style" rel="preload" href="/fonts/inter.css" />
                {props.children}
            </>
        </RootLayout>
    )
}

