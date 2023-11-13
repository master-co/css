import { Viewport } from 'next';

export const metadata = {
    metadataBase: new URL(process.env.HOST as string),
    title: {
        template: '%s - Master CSS',
        default: 'Master CSS'
    }
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
    userScalable: true
}

export default async function RootLayout({
    children
}: {
    children: JSX.Element
}) {
    return children
}
