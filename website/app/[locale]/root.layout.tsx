'use client'

import '../globals.css'
import { getPreInitScript } from 'theme-service'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { importTranslations } from '~/i18n'

import { RedirectsProvider } from 'websites/contexts/redirects'
import { LocaleProvider } from 'websites/contexts/locale'
import { I18nProvider } from 'websites/contexts/i18n'
import redirects from '~/redirects.mjs'
import { Analytics } from '@vercel/analytics/react'
import config from '~/master.css'
import CSSRuntimeProvider from '@master/css.react/CSSRuntimeProvider'
import ThemeServiceProvider from '@master/css.react/ThemeServiceProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import i18n from '~/i18n.config.mjs'

export default function RootLayout({ children, locale, bodyClassName, style, translations }: {
    children: JSX.Element,
    locale: typeof i18n['locales'][number],
    style?: HTMLAttributes<any>['style'],
    bodyClassName?: string,
    translations: any
}) {
    return (
        <html lang={locale} style={process.env.NODE_ENV === 'development' ? { display: 'none' } : style}>
            <head>
                <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
                <script dangerouslySetInnerHTML={{ __html: getPreInitScript({ default: 'system' }) }}></script>
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=block" rel="stylesheet" />
                {locale === 'tw' && <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=block" rel="stylesheet" />}
            </head>
            <body className={clsx(bodyClassName, '{font:mono;font-feature:normal}_:where(code,kbd,samp) bg:slate-50/.2_:where(::selection) fg:neutral font-feature:\'salt\' font:sans overflow-x:hidden')}>
                <ThemeServiceProvider options={{ default: 'system' }}>
                    <CSSRuntimeProvider config={config}>
                        <RedirectsProvider value={redirects}>
                            <I18nProvider value={{ ...i18n, translations }}>
                                <LocaleProvider value={locale}>
                                    {children}
                                </LocaleProvider>
                            </I18nProvider>
                        </RedirectsProvider>
                    </CSSRuntimeProvider>
                </ThemeServiceProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    )
}
