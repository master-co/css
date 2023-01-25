import { masterCSSCommonSchema } from './common-schema'

export function masterCSSFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return masterCSSCommonSchema({ aot, jit, moduleExports: true, typeSyntax: true, require: true })
}