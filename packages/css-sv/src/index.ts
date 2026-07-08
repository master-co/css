import { defineAddon } from 'sv'
import {
  addMasterCSSServerHook,
  addMasterCSSStylesheetImport,
  addMasterCSSVitePlugin,
  addStylesheetImportToLayout,
  MASTER_CSS_PACKAGE,
  MASTER_CSS_SVELTE_PACKAGE,
  MASTER_CSS_SVELTE_VERSION,
  MASTER_CSS_VERSION,
  resolveHooksServerPath
} from './transforms'

export default defineAddon({
  id: 'master-css',
  alias: 'mastercss',
  shortDescription: 'Master CSS integration',
  homepage: 'https://css.master.co/guide/installation/svelte',
  options: {},
  setup({ isKit, unsupported }) {
    if (!isKit) unsupported('Requires SvelteKit')
  },
  run({ sv, cwd, directory, file, language, dependencyVersion, cancel }) {
    const svelteVersion = dependencyVersion('svelte')
    if (!svelteVersion) {
      return cancel('Requires a Svelte dependency in package.json')
    }

    sv.dependency(MASTER_CSS_PACKAGE, MASTER_CSS_VERSION)
    sv.dependency(MASTER_CSS_SVELTE_PACKAGE, MASTER_CSS_SVELTE_VERSION)
    sv.file(file.viteConfig, addMasterCSSVitePlugin)
    sv.file(file.stylesheet, addMasterCSSStylesheetImport)

    const rootLayout = `${directory.kitRoutes}/+layout.svelte`
    const stylesheetRelativePath = file.getRelative({
      from: rootLayout,
      to: file.stylesheet
    })
    sv.file(rootLayout, (content) => addStylesheetImportToLayout(
      content,
      language,
      stylesheetRelativePath,
      svelteVersion
    ))

    sv.file(
      resolveHooksServerPath(cwd, directory.src, language),
      (content) => addMasterCSSServerHook(content, language)
    )
  }
})
