import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm'
import { mdxjsEsmFromMarkdown } from 'mdast-util-mdxjs-esm'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx'

const root = fileURLToPath(new URL('../app/[locale]', import.meta.url))
const sharedComponents = new Set(['Image'])
const jsxParser = acorn.Parser.extend(jsx())
const mdxAcorn = { ...acorn, Parser: jsxParser, parse: jsxParser.parse.bind(jsxParser), parseExpressionAt: jsxParser.parseExpressionAt.bind(jsxParser) }

async function mdxFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await mdxFiles(filename))
    else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(filename)
  }
  return files
}

function missingImports(source: string): string[] {
  // Some authored code examples contain angle brackets inside string expressions.
  // Their child text is not an MDX component, but the containing tag is.
  source = source.replace(/(<(?:Code|Class2CSS|DocumentDeclaration)\b[^>]*>)\{[\s\S]*?\}(<\/(?:Code|Class2CSS|DocumentDeclaration)>)/g, '$1{"example"}$2')
  let tree: any
  try {
    tree = fromMarkdown(source, {
      extensions: [mdxjsEsm({ acorn: mdxAcorn, addResult: true }), mdxJsx({ acorn: mdxAcorn, addResult: true })],
      mdastExtensions: [mdxjsEsmFromMarkdown(), mdxJsxFromMarkdown()]
    })
  } catch {
    return missingImportsFromSource(source)
  }
  const declared = new Set(sharedComponents)
  const used = new Set<string>()
  const visit = (node: any) => {
    if (node.type === 'mdxjsEsm') {
      for (const statement of node.data?.estree?.body ?? []) {
        if (statement.type === 'ImportDeclaration') {
          for (const specifier of statement.specifiers) declared.add(specifier.local.name)
        } else if (statement.type === 'VariableDeclaration') {
          for (const declaration of statement.declarations) if (declaration.id.type === 'Identifier') declared.add(declaration.id.name)
        } else if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
          if (statement.id?.name) declared.add(statement.id.name)
        }
      }
    }
    if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && /^[A-Z]/.test(node.name ?? '')) {
      used.add(node.name.split('.')[0])
    }
    node.children?.forEach(visit)
  }
  visit(tree)
  return [...new Set([...used, ...missingImportsFromSource(source)])].filter(name => !declared.has(name)).sort()
}

function missingImportsFromSource(source: string): string[] {
  source = source.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/`[^`\n]*`/g, '')
  const declared = new Set(sharedComponents)
  for (const match of source.matchAll(/^import\s+([\s\S]*?)\s+from\s+['"][^'"]+['"]/gm)) {
    const clause = match[1].trim()
    const named = clause.match(/\{([^}]+)\}/)?.[1]
    if (named) for (const item of named.split(',')) declared.add(item.trim().split(/\s+as\s+/).at(-1)!)
    const defaultName = clause.split(/[\s,{]/)[0]
    if (defaultName && defaultName !== '*') declared.add(defaultName)
  }
  source = source.replace(/\{[^{}]*\}/g, '').replace(/'[^'\n]*'/g, '').replace(/"[^"\n]*"/g, '')
  const used = new Set([...source.matchAll(/<([A-Z][\w.]*)\b/g)].map(match => match[1].split('.')[0]))
  return [...used].filter(name => !declared.has(name)).sort()
}

test('MDX custom components have explicit imports', async () => {
  const missing: Record<string, string[]> = {}
  for (const filename of await mdxFiles(root)) {
    const source = await readFile(filename, 'utf8')
    try {
      const names = missingImports(source)
      if (names.length) missing[path.relative(root, filename)] = names
    } catch (error) {
      throw new Error(`Cannot inspect ${path.relative(root, filename)}`, { cause: error })
    }
  }
  assert.deepEqual(missing, {})
})

test('MDX import check includes nested tags and ignores code examples', () => {
  assert.deepEqual(missingImports('import StepSection from "./StepSection"\n\n<StepSection><StepL>Text</StepL></StepSection>'), ['StepL'])
  assert.deepEqual(missingImports('```jsx\n<Missing />\n```'), [])
})
