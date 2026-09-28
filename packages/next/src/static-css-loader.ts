import { addStaticCSSDependencies, readStaticState, refreshStaticOutput, transformStaticStyleSource } from './static'

const generatedCSSPath = /[/\\]\.master[/\\]next\.css$/

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
  const watch = () => addStaticCSSDependencies(statePath, this.addDependency?.bind(this), this.addContextDependency?.bind(this), this.addMissingDependency?.bind(this))
  const run = Promise.resolve().then(async () => {
    const state = readStaticState(statePath)
    if (generatedCSSPath.test(this.resourcePath)) {
      // A broad Turbopack root can also contain another project's output.
      if (this.resourcePath !== state.outputPath) return source
      const content = await refreshStaticOutput(statePath)
      await watch()
      return content
    }
    await watch()
    const content = await transformStaticStyleSource(statePath, this.resourcePath, source, preprocessorDependencies)
    // Transformation can discover resources and publish new companion files.
    await watch()
    return content
  }).then(content => {
    callback(null, content)
  })
    .catch((error: Error) => callback(error))

  void run
}
