export interface ToolSchema {
  type?: string
  properties?: Record<string, ToolSchema>
  items?: ToolSchema
  required?: string[]
  enum?: unknown[]
  minLength?: number
  minimum?: number
  maximum?: number
}
export interface ToolParameter {
  name: string
  type: string
  requirement: string
  description: string
}
const quote = (text: string) => `\`${text}\``
const cell = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ')

/** Presentation only: types and bounds come from the advertised protocol schema. */
export function schemaParameters(schema: ToolSchema, descriptions: Record<string, string>): ToolParameter[] {
  const rows: ToolParameter[] = []
  function visit(object: ToolSchema, prefix = '', parentRequired = true) {
    for (const [key, field] of Object.entries(object.properties ?? {})) {
      const name = prefix + key
      if (!Object.hasOwn(descriptions, name)) throw new Error(`Missing parameter description: ${name}`)
      const required = object.required?.includes(key) ?? false
      const details = [descriptions[name]]
      if (field.enum) details.push(`Values: ${field.enum.map(value => quote(String(value))).join(', ')}.`)
      if (field.minLength !== undefined) details.push(`Minimum length: ${field.minLength}.`)
      if (field.minimum !== undefined) details.push(`Minimum: ${field.minimum}.`)
      // Integer representation bounds remain in the complete schema, not each reading row.
      if (field.maximum !== undefined && field.maximum !== Number.MAX_SAFE_INTEGER) details.push(`Maximum: ${field.maximum}.`)
      const type = field.type === 'array' ? `${field.items?.type ?? 'unknown'}[]` : field.type ?? 'unknown'
      rows.push({ name, type, requirement: required ? parentRequired ? 'Required' : 'Required when parent is provided' : 'Optional', description: details.join(' ') })
      if (field.properties) visit(field, name + '.', parentRequired && required)
    }
  }
  visit(schema)
  const actual = new Set(rows.map(row => row.name))
  for (const name of Object.keys(descriptions)) if (!actual.has(name)) throw new Error(`Stale parameter description: ${name}`)
  return rows
}

export function parametersMarkdown(rows: readonly ToolParameter[]) {
  if (!rows.length) return 'No parameters. Pass an empty arguments object: `{}`.'
  return [
    '| Parameter | Type | Requirement | Description |',
    '| --- | --- | --- | --- |',
    ...rows.map(row => `| ${quote(cell(row.name))} | ${quote(cell(row.type))} | ${cell(row.requirement)} | ${cell(row.description)} |`)
  ].join('\n')
}

/** Preserve public help text; reflow its documented option rows for narrow reading columns. */
export function cliParameters(help: string): ToolParameter[] {
  const rows: ToolParameter[] = []
  let section = ''
  for (const line of help.split('\n')) {
    if (/^(Arguments|Options):$/.test(line)) { section = line.slice(0, -1); continue }
    if (!section || !line.trim()) continue
    const match = line.match(/^ {2}(\S.*?)(?: {2,})(\S.*)$/)
    if (match) {
      const name = match[1].trim()
      rows.push({ name, type: section === 'Arguments' ? 'path[]' : /<[^>]+>/.test(name) ? 'value' : 'flag', requirement: 'Optional', description: match[2].trim() })
    } else if (/^ {4,}\S/.test(line) && rows.length) rows[rows.length - 1].description += ' ' + line.trim()
    else throw new Error(`Unrecognized CLI help row: ${line}`)
  }
  if (!rows.length) throw new Error('CLI help has no arguments or options')
  return rows
}
