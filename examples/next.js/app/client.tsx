'use client'

import CSSRuntimeProvider from '@master/css.react'
import config from 'virtual:master-css-config'

export default function Client({ children }: {
    children: React.ReactNode
}) {
    return (
        <CSSRuntimeProvider config={config}>
            {children}
        </CSSRuntimeProvider>
    )
}
