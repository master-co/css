export const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'

/** Build-time protocol for official adapters that deliver several Vite entries as one page. */
export const STYLE_ENTRY_COVERAGE_PLUGIN = 'master-css:style-entry:coverage'

export interface StyleEntryGraphModule {
  readonly isEntry: boolean
  readonly importers: readonly string[]
  readonly dynamicImporters: readonly string[]
}

export interface StyleEntryCoverageAPI {
  coveredRoots(context: {
    config: { root: string, plugins: readonly { name: string, api?: unknown }[] }
    environment: string
    input: unknown
    getModule: (id: string) => StyleEntryGraphModule | null
    withEntry: ReadonlySet<string>
  }): readonly string[]
}

const STYLESHEET_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/

export function cleanStylesheetModuleRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

export function isStylesheetModuleRequest(id: string) {
  if (STYLESHEET_REQUEST_RE.test(id)) return true
  const queryStart = id.indexOf('?')
  if (queryStart === -1) return false
  const parameters = new URLSearchParams(id.slice(queryStart + 1))
  if (parameters.get('type') !== 'style') return false
  const language = parameters.get('lang')
  return language === 'css' || language === 'scss' || language === 'sass'
}
