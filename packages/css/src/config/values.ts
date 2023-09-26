import type { MasterCSS } from '../core'

export type Values = { [key: string]: string | number | Values } | ((this: MasterCSS, resolvedValues: Record<string, Record<string, string | number>>) => Values)