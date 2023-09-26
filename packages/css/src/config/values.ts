import type { MasterCSS } from '../core'

export type Values = { [key: string]: string | number | Values } | ((css: MasterCSS) => Values)