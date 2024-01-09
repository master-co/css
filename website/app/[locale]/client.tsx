'use client'

import { RedirectsProvider } from 'websites/contexts/redirects'
import redirects from '~/redirects.mjs'
import { Analytics } from '@vercel/analytics/react'
import config from '../../master.css'
import CSSRuntimeProvider from '@master/css.react/CSSRuntimeProvider'
import ThemeServiceProvider from '@master/css.react/ThemeServiceProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function Client(props: any) {
    return (
        <>
            <ThemeServiceProvider options={{ default: 'system' }}>
                <CSSRuntimeProvider config={config}>
                    <RedirectsProvider value={redirects}>
                        {props.children}
                    </RedirectsProvider>
                </CSSRuntimeProvider>
            </ThemeServiceProvider>
            <Analytics />
            <SpeedInsights />
        </>
    )
}