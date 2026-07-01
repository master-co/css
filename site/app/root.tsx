'use client'

import RootLayout from 'internal/layouts/root'
import i18n from '~/internal/common/i18n.config.js'
import app from '~/site/app'
import redirects from '~/site/redirects.js'
import units from '~/site/units'

const localePrefixMode = process.env.NEXT_PUBLIC_SITE_LOCALE_PREFIX_MODE === 'always' ? 'always' : 'canonical'
const localizablePathnameRoots = Object.keys(units)

export default function RootClient(props: {
    children: React.ReactNode,
    locale: typeof i18n.locales[number],
    style?: React.CSSProperties,
    translations: any,
    hidden?: boolean,
}) {
    return (
        <RootLayout {...props} app={app} redirects={redirects} localePrefixMode={localePrefixMode} localizablePathnameRoots={localizablePathnameRoots} />
    )
}
