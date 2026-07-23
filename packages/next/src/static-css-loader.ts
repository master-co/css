import { addStaticCSSDependencies, transformStaticStyleSource } from './static'

interface LoaderContext {
  resourcePath: string
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

  const run = addStaticCSSDependencies(statePath, this.addDependency?.bind(this))
    .then(() => transformStaticStyleSource(statePath, this.resourcePath, source))
    .then((content) => callback(null, content))
    .catch((error: Error) => callback(error))

  void run
}
