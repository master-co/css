import type { Config } from '.'
import type { MasterCSS } from '../core'

type ExtendedValues = { [key: string]: string | number | Values }
export type Values = ExtendedValues | ((this: MasterCSS, resolvedValues: Record<string, Record<string, string | number>>) => ExtendedValues)