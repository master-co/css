import './globals.css'
import { CSSRuntimeRegistry } from '@master/css.react'

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
                <CSSRuntimeRegistry>
                    {children}
                </CSSRuntimeRegistry>
            </body>
        </html>
    )
}
