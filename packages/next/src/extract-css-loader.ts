import { replaceExtractedCSSImport } from './extract'

interface LoaderContext {
    cacheable?: (flag?: boolean) => void
    async?: () => (error: Error | null, content?: string) => void
    getOptions?: () => {
        statePath?: string
    }
}

export default function masterCSSNextExtractCSSLoader(this: LoaderContext, source: string) {
    this.cacheable?.(false)
    const callback = this.async?.()
    const statePath = this.getOptions?.().statePath

    if (!callback) {
        throw new Error('[@master/css.next] Extract CSS loader requires an async loader context.')
    }

    if (!statePath) {
        callback(new Error('[@master/css.next] Missing extract CSS loader statePath option.'))
        return
    }

    const run = replaceExtractedCSSImport(statePath, source)
        .then((content) => callback(null, content))
        .catch((error: Error) => callback(error))

    void run
}
