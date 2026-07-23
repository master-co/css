export const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'

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
