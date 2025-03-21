import '@master/normal.css';
import { Viewport } from 'next'

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
}

export const metadata = {
    title: {
        template: `%s - ${process.env.NEXT_PUBLIC_PROJECT}`,
        default: process.env.NEXT_PUBLIC_PROJECT
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL as string)
}

export default async function RootLayout({ children }: {
    children: React.ReactElement
}) {
    return children
}
