import type { webpack } from 'next/dist/compiled/webpack/webpack'

interface ModuleFactory {
  hooks: {
    beforeResolve: {
      tap(name: string, callback: (data: { request: string } | undefined) => void): void
    }
  }
}

export function createWebpackVirtualModulesPlugin(modules: Record<string, string>) {
  const paths = new Map(Object.entries(modules))
  return {
    apply(compiler: webpack.Compiler) {
      // URI requests bypass resolve.alias. Redirect only our known virtual IDs
      // before Webpack dispatches them to a scheme-specific resource handler.
      compiler.hooks.normalModuleFactory.tap('MasterCSSNextVirtualModules', (factory: ModuleFactory) => {
        factory.hooks.beforeResolve.tap('MasterCSSNextVirtualModules', data => {
          if (!data) return
          const path = paths.get(data.request)
          if (path !== undefined) data.request = path
        })
      })
    }
  }
}
