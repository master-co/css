import { scanStaticModule, addStaticCSSDependencies } from './static'

interface LoaderContext {
  resourcePath: string
  addContextDependency?: (directory: string) => void
  addMissingDependency?: (file: string) => void
  addDependency?: (file: string) => void
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
    throw new Error('[@master/css-next] Static loader requires an async loader context.')
  }

  if (!statePath) {
    const error = new Error('[@master/css-next] Missing static loader statePath option.')
    callback(error)
    return
  }

  const run = scanStaticModule(statePath, this.resourcePath, source)
    .then(async () => {
      await addStaticCSSDependencies(statePath, this.addDependency?.bind(this), this.addContextDependency?.bind(this), this.addMissingDependency?.bind(this))
      callback(null, source)
    })
    .catch((error: Error) => callback(error))

  void run
}
