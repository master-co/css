import './globals.css'
// @ts-expect-error
import PRE_INIT_SCRIPT from '!!raw-loader!theme-mode/pre-init'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import i18n from '~/i18n.config.mjs'
import Client from './client'
import FontStyle from 'websites/components/FontStyle'

export default async function RootLayout({ children, locale, bodyClassName, style, translations }: {
    children: JSX.Element[] | JSX.Element,
    locale: typeof i18n['locales'][number],
    style?: HTMLAttributes<any>['style'],
    bodyClassName?: string,
    translations: any
}) {
    return (
        <html lang={locale} style={process.env.NODE_ENV === 'development' ? { display: 'none' } : style} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
                <script dangerouslySetInnerHTML={{ __html: PRE_INIT_SCRIPT }}></script>
                <FontStyle locale={locale} />
                <style id="master" suppressHydrationWarning></style>
            </head>
            <body className={clsx(bodyClassName, '{font:mono;font-feature:mono}_:where(code,kbd,samp) bg:slate-50/.2_:where(::selection) fg:neutral font-feature:sans font:sans')}>
                <Client locale={locale} translations={translations}>
                    {children}
                </Client>
            </body>
        </html>
    )
}
