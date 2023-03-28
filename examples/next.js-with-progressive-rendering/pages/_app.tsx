import '~/styles/globals.css'
import type { AppProps } from 'next/app'
import { LazyCSSProvider } from '@master/css.react'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <LazyCSSProvider config={import('../master.css')}>
            <Component {...pageProps} />
        </LazyCSSProvider>
    )
}