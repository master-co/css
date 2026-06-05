import type * as LightningCSS from 'lightningcss'

export type CSSTransform = typeof LightningCSS.transform

let transform: CSSTransform | undefined

export function setCSSTransform(transformer: CSSTransform) {
    transform = transformer
}

export function getCSSTransform() {
    if (!transform) {
        throw new Error('@master/css-compiler requires a CSS transform implementation. Use the default Node entry or initialize the browser entry.')
    }
    return transform
}

export function encodeCSS(source: string) {
    return new TextEncoder().encode(source)
}

export function decodeCSS(code: Uint8Array) {
    return new TextDecoder().decode(code)
}
