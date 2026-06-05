import { scanStaticModule } from './static'

interface LoaderContext {
    resourcePath: string
    cacheable?: (flag?: boolean) => void
    async?: () => (error: Error | null, content?: string) => void
    getOptions?: () => {
        statePath?: string
    }
}

export default function masterCSSNextStaticLoader(this: LoaderContext, source: string) {
    this.cacheable?.(false)
    const callback = this.async?.()
    const statePath = this.getOptions?.().statePath

    if (!callback) {
        throw new Error('[@master/css.next] Static loader requires an async loader context.')
    }

    if (!statePath) {
        const error = new Error('[@master/css.next] Missing static loader statePath option.')
        callback(error)
        return
    }

    const run = scanStaticModule(statePath, this.resourcePath, source)
        .then(() => {
            callback(null, source)
        })
        .catch((error: Error) => callback(error))

    void run
}
