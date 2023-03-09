import '~/styles/globals.css'
import type { AppProps } from 'next/app'
import { CSSProvider  } from '@master/css.react'
import { config } from '../master.css'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <CSSProvider config={config}>
            <Component {...pageProps} />
        </CSSProvider>
    )
}