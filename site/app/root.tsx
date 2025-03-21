'use client'

import RootLayout from 'internal/layouts/root'
import i18n from '~/internal/common/i18n.config.mjs'
import app from '~/site/app'
import redirects from '~/site/redirects.mjs'
import cssConfig from '~/site/master.css'

export default function RootClient(props: {
    children: React.ReactElement,
    locale: typeof i18n.locales[number],
    style?: React.CSSProperties,
    translations: any,
    hidden?: boolean,
}) {
    return (
        <RootLayout {...props} app={app} cssConfig={cssConfig} redirects={redirects} />
    )
}