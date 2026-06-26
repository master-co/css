'use client'

import RootLayout from 'internal/layouts/root'
import i18n from '~/internal/common/i18n.config.js'
import app from '~/site/app'
import redirects from '~/site/redirects.js'

export default function RootClient(props: {
    children: React.ReactNode,
    locale: typeof i18n.locales[number],
    style?: React.CSSProperties,
    translations: any,
    hidden?: boolean,
}) {
    return (
        <RootLayout {...props} app={app} redirects={redirects} />
    )
}
