import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { init } from '@master/css'

init()

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
