'use client'

import { CSSProvider } from '@master/css.react'
import config from '../master.css'

export default function Client({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CSSProvider config={config}>
            {children}
        </CSSProvider>
    )
}
