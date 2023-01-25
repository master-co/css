import { masterCSSCommonSchema } from './common-schema'

export function masterCSSTSFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return masterCSSCommonSchema({ aot, jit })
}