import '../globals.css'
import { getPreInitScript } from 'theme-service'
import { Locale } from 'websites/i18n.config'
import { RedirectsProvider } from 'websites/contexts/redirects'
import redirects from '~/redirects.mjs'
import { Analytics } from '@vercel/analytics/react'
import config from '../../master.css'
import CSSProvider from '@master/css.react/CSSProvider'
import ThemeServiceProvider from '@master/css.react/ThemeServiceProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import clsx from 'clsx'

export default async function RootLayout({
    children,
    params,
    bodyAttrs,
    ...props
}: {
    children: JSX.Element,
    params: { locale: Locale },
    bodyAttrs?: any,
    [key: string]: any
}) {
    return (
        <html lang={params.locale} style={process.env.NODE_ENV === 'development' ? { display: 'none' } : undefined} {...props}>
            <head>
                <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
                <script dangerouslySetInnerHTML={{ __html: getPreInitScript({ default: 'system' }) }}></script>
                {params.locale === 'tw' &&
                    <>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='' />
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet" />
                    </>
                }
                <style id="master" dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
            </head>
            <body {...bodyAttrs} className={clsx(bodyAttrs?.className, 'bg:slate-50/.2_:where(::selection) fg:neutral font:mono_:where(code,kbd,samp) font:sans overflow-x:hidden')}>
                <ThemeServiceProvider options={{ default: 'system' }}>
                    <CSSProvider config={config}>
                        <RedirectsProvider value={redirects}>
                            {children}
                        </RedirectsProvider>
                    </CSSProvider>
                </ThemeServiceProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    )
}
