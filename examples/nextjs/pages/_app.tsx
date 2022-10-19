import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { init } from '../../../dist/esm'

init()

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
