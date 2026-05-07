import './globals.css'
import CSSRuntimeProvider from '@master/css.react'
import config from '../master.css?master-css-config'

export const metadata = {
    title: 'Master CSS Next.js Adapter',
    description: 'Master CSS Next.js adapter playground'
}

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" hidden={process.env.NODE_ENV === 'development'}>
            <body>
                <CSSRuntimeProvider config={config}>
                    {children}
                </CSSRuntimeProvider>
            </body>
        </html>
    )
}
