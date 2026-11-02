import { getContext, setContext } from 'svelte'

export type CopyResult = 'success' | 'error' | undefined
export type CopyFeedback = (message: string, result: CopyResult) => void

const key = Symbol('demo-copy-feedback')

/** A copy group's shared status; buttons inside the same Svelte tree report to it. */
export const setCopyFeedback = (report: CopyFeedback) => setContext(key, report)
export const getCopyFeedback = () => getContext<CopyFeedback | undefined>(key)
