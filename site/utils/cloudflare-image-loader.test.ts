import assert from 'node:assert/strict'
import { test } from 'node:test'
import cloudflareImageLoader, {
    createCloudflareImageUrl,
    shouldUseCloudflareImageLoader
} from './cloudflare-image-loader.js'

test('transforms local master.co bitmap paths through Cloudflare Images', () => {
    assert.equal(
        createCloudflareImageUrl({
            src: '/_next/static/media/example.jpg',
            width: 640,
            quality: 75,
            siteUrl: 'https://css.master.co'
        }),
        'https://css.master.co/cdn-cgi/image/width=640,quality=75,format=auto/_next/static/media/example.jpg'
    )
})

test('defaults image quality to 75', () => {
    assert.equal(
        createCloudflareImageUrl({
            src: '/images/example.png',
            width: 384,
            siteUrl: 'https://rc.css.master.co'
        }),
        'https://rc.css.master.co/cdn-cgi/image/width=384,quality=75,format=auto/images/example.png'
    )
})

test('keeps unsupported and already optimized source types unchanged', () => {
    for (const src of [
        '/images/logo.svg',
        '/favicon.ico',
        '/images/animated.gif',
        '/cdn-cgi/image/width=640,quality=75,format=auto/images/example.jpg',
        'data:image/png;base64,abc',
        'blob:https://css.master.co/abc'
    ]) {
        assert.equal(
            createCloudflareImageUrl({
                src,
                width: 640,
                siteUrl: 'https://css.master.co'
            }),
            src
        )
    }
})

test('keeps local and non-master preview hosts unchanged', () => {
    for (const siteUrl of [
        'http://localhost:3000',
        'https://feature-preview.pages.dev'
    ]) {
        assert.equal(
            createCloudflareImageUrl({
                src: '/_next/static/media/example.jpg',
                width: 640,
                siteUrl
            }),
            '/_next/static/media/example.jpg'
        )
    }
})

test('keeps third-party remote URLs unchanged', () => {
    const src = 'https://avatars.githubusercontent.com/u/33840671?v=4'

    assert.equal(
        createCloudflareImageUrl({
            src,
            width: 128,
            siteUrl: 'https://css.master.co'
        }),
        src
    )
})

test('uses NEXT_PUBLIC_URL when called as a Next image loader', () => {
    const previousPublicUrl = process.env.NEXT_PUBLIC_URL
    process.env.NEXT_PUBLIC_URL = 'https://css.master.co'

    try {
        assert.equal(
            cloudflareImageLoader({
                src: '/images/example.webp',
                width: 828,
                quality: undefined
            }),
            'https://css.master.co/cdn-cgi/image/width=828,quality=75,format=auto/images/example.webp'
        )
    } finally {
        if (previousPublicUrl === undefined) {
            delete process.env.NEXT_PUBLIC_URL
        } else {
            process.env.NEXT_PUBLIC_URL = previousPublicUrl
        }
    }
})

test('enables custom loader only for Cloudflare master.co builds by default', () => {
    assert.equal(shouldUseCloudflareImageLoader({
        env: {
            CF_PAGES: '1'
        },
        siteUrl: 'https://css.master.co'
    }), true)

    assert.equal(shouldUseCloudflareImageLoader({
        env: {
            CF_PAGES: '1'
        },
        siteUrl: 'https://feature-preview.pages.dev'
    }), false)

    assert.equal(shouldUseCloudflareImageLoader({
        env: {},
        siteUrl: 'https://css.master.co'
    }), false)
})

test('honors image transformation overrides', () => {
    assert.equal(shouldUseCloudflareImageLoader({
        env: {
            MASTER_CSS_IMAGE_TRANSFORMATIONS: 'true'
        },
        siteUrl: 'http://localhost:3000'
    }), true)

    assert.equal(shouldUseCloudflareImageLoader({
        env: {
            CF_PAGES: '1',
            MASTER_CSS_IMAGE_TRANSFORMATIONS: 'false'
        },
        siteUrl: 'https://css.master.co'
    }), false)
})
