'use client'

import './globals.css'
import { getPreInitScript } from 'theme-service'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import i18n from '~/i18n.config.mjs'
import Client from './client'

export default function RootLayout({ children, locale, bodyClassName, style, translations }: {
    children: JSX.Element[] | JSX.Element,
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
                <Client locale={locale} translations={translations}>
                    {children}
                </Client>
            </body>
        </html>
    )
}
