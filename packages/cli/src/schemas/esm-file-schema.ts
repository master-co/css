import { masterCSSCommonSchema } from './common-schema'

export function masterCSSESMFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return masterCSSCommonSchema({ aot, jit, typeSyntax: true })
}