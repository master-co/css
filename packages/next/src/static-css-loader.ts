import { addStaticCSSDependencies, transformStaticStyleSource } from './static'

interface LoaderContext {
  resourcePath: string
  getDependencies?: () => string[]
  addContextDependency?: (directory: string) => void
  addMissingDependency?: (file: string) => void
  addDependency?: (file: string) => void
  cacheable?: (flag?: boolean) => void
  async?: () => (error: Error | null, content?: string) => void
  getOptions?: () => {
    statePath?: string
  }
}

export default function masterCSSNextStaticCSSLoader(this: LoaderContext, source: string) {
  this.cacheable?.(false)
  const callback = this.async?.()
  const statePath = this.getOptions?.().statePath

  if (!callback) {
    throw new Error('[@master/css-next] Static CSS loader requires an async loader context.')
  }

  if (!statePath) {
    callback(new Error('[@master/css-next] Missing static CSS loader statePath option.'))
    return
  }

  const preprocessorDependencies = this.getDependencies?.() ?? []
  const run = addStaticCSSDependencies(statePath, this.addDependency?.bind(this), this.addContextDependency?.bind(this), this.addMissingDependency?.bind(this))
    .then(() => transformStaticStyleSource(statePath, this.resourcePath, source, preprocessorDependencies))
    .then(async (content) => {
      // Transformation can discover resources and publish new companion files.
      await addStaticCSSDependencies(statePath, this.addDependency?.bind(this), this.addContextDependency?.bind(this), this.addMissingDependency?.bind(this))
      callback(null, content)
    })
    .catch((error: Error) => callback(error))

  void run
}
