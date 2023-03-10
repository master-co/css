import '~/styles/globals.css'
import type { AppProps } from 'next/app'
import { CSSLazyProvider } from '@master/css.react'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <CSSLazyProvider config={import('../master.css')}>
            <Component {...pageProps} />
        </CSSLazyProvider>
    )
}