import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import i18n from '~/i18n.config.mjs'

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    if (
        // 檢查不包含 opengraph-image
        pathname.indexOf('opengraph-image-') === -1 &&
        // 檢查開頭不等於 /tw ...
        !i18n.locales.find((eachLocale) => pathname.startsWith('/' + eachLocale)) &&
        // 檢查開頭不等於預設 /en
        !pathname.startsWith(i18n.defaultLocale)
    ) {
        // 將 /* 不等於 locales 的網址一律 rewrites 重寫為 /en/*
        return NextResponse.rewrite(new URL('/' + i18n.defaultLocale + pathname, request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/docs(/.*)?',
        '/play(/.*)?',
        '/blog(/.*)?',
        '/roadmap(/.*)?',
        '/sponsor(/.*)?',
        '/examples(/.*)?'
    ],
}
