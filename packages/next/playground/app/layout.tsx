import './globals.css'

export const metadata = {
    title: 'Master CSS Next.js Adapter',
    description: 'Master CSS Next.js adapter playground'
}

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
