import '../globals.css'
import { getPreInitScript } from 'theme-service'
import { Locale } from 'websites/i18n.config'
import clsx from 'clsx'
import Client from './client'
import { HTMLAttributes } from 'react'

export default async function RootLayout({ children, locale, bodyClassName, style }: {
    children: JSX.Element,
    locale: Locale,
    style?: HTMLAttributes<any>['style'],
    bodyClassName?: string
}) {
    return (
        <html lang={locale} style={process.env.NODE_ENV === 'development' ? { display: 'none' } : undefined}>
            <head>
                <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
                <script dangerouslySetInnerHTML={{ __html: getPreInitScript({ default: 'system' }) }}></script>
                <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=block" rel="stylesheet" />
                {locale === 'tw' &&
                    <>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='' />
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=block" rel="stylesheet" />
                    </>
                }
            </head>
            <body className={clsx(bodyClassName, '{font:mono;font-feature:normal}_:where(code,kbd,samp) bg:slate-50/.2_:where(::selection) fg:neutral font-feature:\'salt\' font:sans overflow-x:hidden')}>
                <Client>{children}</Client>
            </body>
        </html>
    )
}
