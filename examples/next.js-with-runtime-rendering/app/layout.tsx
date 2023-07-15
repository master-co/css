import { CSSProvider } from '@master/css.react'
import config from '../master.css'
import './globals.css'

export const metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" style={{ display: 'none' }}>
            <body>
                <CSSProvider config={config}>
                    {children}
                </CSSProvider>
            </body>
        </html>
    )
}