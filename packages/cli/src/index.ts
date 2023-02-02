import { generateFileSchema } from './utils/generate-file-schema'

export function generateTSFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return generateFileSchema({ aot, jit })
}

export function generateESMFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return generateFileSchema({ aot, jit, typeSyntax: true })
}

export function generateCJSFileSchema({ aot, jit }: { aot?: boolean, jit?: boolean }) {
    return generateFileSchema({ aot, jit, moduleExports: true, typeSyntax: true, require: true })
}