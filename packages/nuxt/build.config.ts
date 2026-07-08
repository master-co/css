import { defineBuildConfig, type BuildContext } from 'unbuild'
import { normalizeNuxtModuleBuild } from './scripts/normalize-module-build.js'

const MISSING_PACKAGE_FILES_WARNING = 'Potential missing package.json files:'
const EXPECTED_NORMALIZED_FILES = [
  'dist/module.js',
  'dist/module.d.ts'
]

function removeNormalizedPackageFileWarning(ctx: BuildContext) {
  for (const warning of ctx.warnings) {
    if (
      warning.startsWith(MISSING_PACKAGE_FILES_WARNING)
      && EXPECTED_NORMALIZED_FILES.every((file) => warning.includes(file))
    ) {
      ctx.warnings.delete(warning)
    }
  }
}

export default defineBuildConfig({
  hooks: {
    async 'build:done'(ctx) {
      await normalizeNuxtModuleBuild(ctx.options.rootDir)
      removeNormalizedPackageFileWarning(ctx)
    }
  }
})
