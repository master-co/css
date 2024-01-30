import { Viewport } from 'next'

export const metadata = {
    metadataBase: new URL(process.env.HOST as string)
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
}

export default async function RootLayout({
    children
}: {
    children: JSX.Element
}) {
    return children
}
