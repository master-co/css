import NextDocument, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import { renderFromHTML } from '@master/css'
import { config } from '../master.css'

export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

Document.getInitialProps = async (ctx: DocumentContext) => {
    const initialProps = await NextDocument.getInitialProps(ctx)
    return {
        ...initialProps,
        styles: (
            <>
                <style id="master">{renderFromHTML(initialProps.html, config)}</style>
                {initialProps.styles}
            </>
        )
    }
}