import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { CSSLazyProvider } from '@master/css.react'

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <CSSLazyProvider config={import('../master.css.js')}>
            <Component {...pageProps} />
        </CSSLazyProvider>
    )
}

export default MyApp
