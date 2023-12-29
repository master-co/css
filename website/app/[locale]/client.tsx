'use client'

import { RedirectsProvider } from 'websites/contexts/redirects'
import redirects from '~/redirects.mjs'
import { Analytics } from '@vercel/analytics/react'
import config from '../../master.css'
import CSSProvider from '@master/css.react/CSSProvider'
import ThemeServiceProvider from '@master/css.react/ThemeServiceProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function Client(props: any) {
    return (
        <>
            <ThemeServiceProvider options={{ default: 'system' }}>
                <CSSProvider config={config}>
                    <RedirectsProvider value={redirects}>
                        {props.children}
                    </RedirectsProvider>
                </CSSProvider>
            </ThemeServiceProvider>
            <Analytics />
            <SpeedInsights />
        </>
    )
}