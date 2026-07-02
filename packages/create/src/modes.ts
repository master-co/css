export const renderingModes = ['runtime', 'static', 'progressive', 'pre-render'] as const

export type RenderingMode = typeof renderingModes[number]

export function isRenderingMode(value: unknown): value is RenderingMode {
    return renderingModes.includes(value as RenderingMode)
}

export function formatRenderingModes() {
    return renderingModes.join(', ')
}

export function resolveRenderingMode(value: unknown): RenderingMode | undefined {
    if (value === undefined) return undefined
    if (isRenderingMode(value)) return value
    throw new Error(`Invalid rendering mode "${String(value)}". Supported modes: ${formatRenderingModes()}.`)
}
