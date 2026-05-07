import './globals.css'
import MasterRuntimeProvider from './master-runtime-provider'

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
                <MasterRuntimeProvider>
                    {children}
                </MasterRuntimeProvider>
            </body>
        </html>
    )
}
