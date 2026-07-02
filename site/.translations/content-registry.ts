import type { ComponentType } from 'react'

export type TranslatedContentModule = {
    default: ComponentType<any>
    toc?: unknown
}

export type TranslatedContentLoader = () => Promise<TranslatedContentModule>

const translatedContentRegistry = {
} satisfies Record<string, Record<string, TranslatedContentLoader>>

export default translatedContentRegistry
