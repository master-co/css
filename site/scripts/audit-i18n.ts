import ts from 'typescript'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Finding {
  file: string
  line: number
  kind: string
  text: string
}

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(siteRoot, '..')
const roots = [
  resolve(siteRoot, 'app'),
  resolve(siteRoot, 'components'),
  resolve(repoRoot, 'internal/components'),
  resolve(repoRoot, 'internal/layouts'),
  resolve(repoRoot, 'internal/contexts')
]

const translatableAttributes = new Set(['alt', 'aria-label', 'title', 'placeholder'])
const translatablePropertyNames = new Set(['title', 'description', 'caption', 'detail', 'label'])
const ignoredExact = new Set([
  'Master CSS',
  'Tailwind CSS',
  'Material UI',
  'Styled Components',
  'Visual Studio Code',
  'Open Collective',
  'GitHub Sponsors',
  'NPM',
  'HTML',
  'CSS',
  'JS'
])

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

function scanRoot(root: string): Finding[] {
  return walk(root, (file) => file.endsWith('.tsx') && isAuditableSourceFile(file)).flatMap(scanFile)
}

function scanFile(file: string): Finding[] {
  const source = readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const findings: Finding[] = []

  visit(sourceFile, (node) => {
    if (ts.isJsxText(node)) {
      addFinding(findings, sourceFile, file, node, 'jsx', node.getText(sourceFile))
      return
    }

    if (ts.isJsxAttribute(node) && translatableAttributes.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer)) {
      addFinding(findings, sourceFile, file, node, node.name.getText(sourceFile), node.initializer.text)
      return
    }

    if (!ts.isPropertyAssignment(node)) return
    const name = propertyName(node.name)
    if (!name || !translatablePropertyNames.has(name)) return
    if (!ts.isStringLiteralLike(node.initializer)) return
    addFinding(findings, sourceFile, file, node, name, node.initializer.text)
  })

  return findings.filter((finding) => !isAlreadyTranslated(sourceFile, finding.line))
}

function addFinding(findings: Finding[], sourceFile: ts.SourceFile, file: string, node: ts.Node, kind: string, value: string) {
  const text = normalizeText(value)
  if (!isTranslatableText(text)) return
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  findings.push({
    file: relative(repoRoot, file),
    line: line + 1,
    kind,
    text
  })
}

function isAlreadyTranslated(sourceFile: ts.SourceFile, line: number) {
  const lines = sourceFile.text.split('\n')
  const text = lines[line - 1] || ''
  return /\$\(|<Translate\b|translate=|useTranslation\(/.test(text)
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

function propertyName(name: ts.PropertyName) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
}

function visit(node: ts.Node, callback: (node: ts.Node) => void) {
  callback(node)
  ts.forEachChild(node, (child) => visit(child, callback))
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
  return !/(\.test\.tsx?$|\/api\/|\/\.next\/|\/\.wrangler\/|\/public\/|\/svgs\/|\/node_modules\/)/.test(file.split(sep).join('/'))
}
