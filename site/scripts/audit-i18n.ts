import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentTexts, isComponentFile } from './component-text'

interface Finding {
  file: string
  line: number
  kind: string
  text: string
}

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(siteRoot, '..')
const roots = [
  resolve(siteRoot, 'content'),
  resolve(siteRoot, 'components'),
  resolve(siteRoot, 'docs-shell/components'),
  resolve(siteRoot, 'docs-shell/layouts'),
  resolve(siteRoot, 'docs-shell/contexts')
]

const translatableAttributes = new Set(['alt', 'aria-label', 'title', 'placeholder'])
const translatablePropertyNames = new Set(['title', 'description', 'caption', 'detail', 'label'])
const ignoredExact = new Set([
  'Master CSS',
  'Tailwind CSS',
  'Material UI',
  'Styled Components',
  'Visual Studio Code',
  'NPM',
  'HTML',
  'CSS',
  'JS'
])

{
  const findings = roots.flatMap((root) => scanRoot(root))

  if (findings.length) {
    console.log(`Found ${findings.length} possible untranslated site strings:`)
    for (const finding of findings.slice(0, 200)) {
      console.log(`${finding.file}:${finding.line} ${finding.kind} ${JSON.stringify(finding.text)}`)
    }
    if (findings.length > 200) {
      console.log(`... ${findings.length - 200} more`)
    }
  } else {
    console.log('No obvious untranslated site strings found.')
  }

  if (process.argv.includes('--strict') && findings.length) {
    process.exitCode = 1
  }
}

function scanRoot(root: string): Finding[] {
  return walk(root, (file) => isComponentFile(file) && isAuditableSourceFile(file)).flatMap(scanFile)
}

function scanFile(file: string): Finding[] {
  const lines = readFileSync(file, 'utf8').split('\n')
  return componentTexts(file, { attributes: translatableAttributes, properties: translatablePropertyNames })
    .map(({ line, kind, text }) => ({ file: relative(repoRoot, file), line, kind, text: normalizeText(text) }))
    .filter(({ line, text }) => isTranslatableText(text) && !isAlreadyTranslated(lines[line - 1] || ''))
}

function isAlreadyTranslated(text: string) {
  return /\$\(|\bt\(|<Translate\b|translate=/.test(text)
}

function isTranslatableText(value: string) {
  const text = normalizeText(value)
  if (!text || text.length < 2) return false
  if (!/[A-Za-z]/.test(text)) return false
  if (ignoredExact.has(text)) return false
  if (/^https?:\/\//.test(text)) return false
  if (/^[-\w:/.#@|()[\]{}%]+$/.test(text)) return false
  if (/^import\s|^export\s/.test(text)) return false
  return true
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}


function walk(root: string, filter: (file: string) => boolean): string[] {
  if (!existsSync(root)) return []
  const files: string[] = []
  for (const entry of readdirSync(root)) {
    const file = resolve(root, entry)
    const stat = statSync(file)
    if (stat.isDirectory()) {
      files.push(...walk(file, filter))
    } else if (stat.isFile() && filter(file)) {
      files.push(file)
    }
  }
  return files
}

function isAuditableSourceFile(file: string) {
  return !/(\.test\.ts$|\/api\/|\/\.astro\/|\/\.wrangler\/|\/public\/|\/svgs\/|\/node_modules\/)/.test(file.split(sep).join('/'))
}
