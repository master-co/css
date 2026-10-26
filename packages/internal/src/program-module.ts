/**
 * Runtime programs are manifests compiled for the browser engine. Browsers import
 * `virtual:master-css-program`, whose default export is the program bytes; server
 * rendering keeps importing the manifest.
 */
export const VIRTUAL_PROGRAM_ID = 'virtual:master-css-program'
export const RESOLVED_VIRTUAL_PROGRAM_ID = `\0${VIRTUAL_PROGRAM_ID}`
export const MASTER_CSS_PROGRAM_QUERY = '?master-css-program'
export const PROGRAM_ASSET_FILE = 'master-css-program.bin'
export const MASTER_CSS_PROGRAM_PRELOAD_REL = 'preload'
export const MASTER_CSS_PROGRAM_PRELOAD_AS = 'fetch'

export interface ProgramPreloadLinkAttrs {
  rel: typeof MASTER_CSS_PROGRAM_PRELOAD_REL
  as: typeof MASTER_CSS_PROGRAM_PRELOAD_AS
  crossorigin: ''
  href: string
}

export function isMasterCSSProgramRequest(id: string) {
  return id.endsWith(MASTER_CSS_PROGRAM_QUERY)
}

export function stripMasterCSSProgramQuery(id: string) {
  return isMasterCSSProgramRequest(id)
    ? id.slice(0, -MASTER_CSS_PROGRAM_QUERY.length)
    : id
}

function toBase64(program: Uint8Array) {
  let binary = ''
  // Bounded chunks keep String.fromCharCode below the argument limit.
  for (let index = 0; index < program.length; index += 0x8000) {
    binary += String.fromCharCode(...program.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

/** Development and server builds inline the program instead of emitting an asset. */
export function toInlineProgramModule(program: Uint8Array) {
  return [
    `const masterCSSProgram = atob(${JSON.stringify(toBase64(program))});`,
    `export default Uint8Array.from(masterCSSProgram, character => character.charCodeAt(0));`,
    ``
  ].join('\n')
}

/** Browser builds fetch the emitted program, which `<link rel="preload" as="fetch">` can start early. */
export function toBrowserProgramFacadeModule(urlExpression: string) {
  return [
    `const masterCSSProgramURL = ${urlExpression};`,
    `const masterCSSProgramResponse = await fetch(masterCSSProgramURL);`,
    `if (!masterCSSProgramResponse.ok) throw new Error(\`Cannot load the Master CSS runtime program from \${masterCSSProgramURL} (HTTP \${masterCSSProgramResponse.status}).\`);`,
    `export default new Uint8Array(await masterCSSProgramResponse.arrayBuffer());`,
    ``
  ].join('\n')
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

export function toProgramPreloadLinkAttrs(href: string): ProgramPreloadLinkAttrs {
  return {
    rel: MASTER_CSS_PROGRAM_PRELOAD_REL,
    as: MASTER_CSS_PROGRAM_PRELOAD_AS,
    crossorigin: '',
    href
  }
}

export function toProgramPreloadLinkTag(href: string) {
  const attrs = toProgramPreloadLinkAttrs(href)
  return [
    '<link',
    `rel="${attrs.rel}"`,
    `as="${attrs.as}"`,
    'crossorigin',
    `href="${escapeAttributeValue(attrs.href)}">`
  ].join(' ')
}
