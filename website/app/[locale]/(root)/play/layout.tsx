import { Locale } from 'websites-shared/i18n.config'

export default async function Layout({
    children
}: {
    children: JSX.Element,
    params: { locale: Locale }
}) {
    return (
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
            {children}
        </>
    )
}