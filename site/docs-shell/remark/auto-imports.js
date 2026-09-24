import fs from 'fs'
import path from 'path'
import upath from 'upath'
import fg from 'fast-glob'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { parse } from 'acorn'
import { visit } from 'unist-util-visit'

function createImportNode(code) {
  return {
    type: 'mdxjsEsm',
    value: code,
    data: {
      estree: parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      }),
    },
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default function remarkAutoImports() {
  return async (tree, file) => {
    const imports = new Set()
    const names = new Set()

    // Get current mdx file directory
    const mdxFilePath = file.path
    const currentDir = upath.join(path.dirname(mdxFilePath), './components')
    const existingImports = new Set()

    // Collect all component names used in the tree
    const usedComponents = new Set()
    visit(tree, (node) => {
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        if (node.name && /^[A-Z]/.test(node.name)) {
          usedComponents.add(node.name)
        }
      }
    })

    // Respect default and named imports already declared by the page.
    visit(tree, (node) => {
      if (node.type === 'mdxjsEsm' && typeof node.value === 'string') {
        const program = node.data?.estree || parse(node.value, {
          ecmaVersion: 'latest',
          sourceType: 'module',
        })
        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration') continue
          for (const specifier of statement.specifiers) {
            existingImports.add(specifier.local.name)
          }
        }
      }
    })

    // 1. Relative components (./components/*.tsx or .mdx)
    const relativePaths = fg.sync(`${currentDir}/*.{tsx,mdx}`.replace(/([()])/g, '\\$1'))
    for (const eachComponentPath of relativePaths) {
      const { name } = upath.parse(eachComponentPath)
      if (names.has(name) || !usedComponents.has(name) || existingImports.has(name)) continue
      names.add(name)

      const relativeImport = './' + upath.relative(path.dirname(mdxFilePath), eachComponentPath)
      imports.add(`import ${name} from '${relativeImport}';`)
    }

    // 2. Site document shell components
    const shellPaths = fg.sync(upath.join(__dirname, '../components/*').replace(/([()])/g, '\\$1'))
    for (const eachComponentPath of shellPaths) {
      const { name } = upath.parse(eachComponentPath)
      if (names.has(name) || !usedComponents.has(name) || existingImports.has(name)) continue
      names.add(name)
      const content = fs.readFileSync(eachComponentPath, 'utf-8')
      if (content.startsWith(`'use client'`)) {
        imports.add(`import dynamic from "next/dynamic";`)
        imports.add(`export const ${name} = dynamic(() => import('~/site/docs-shell/components/${name}'));`)
      } else {
        imports.add(`import ${name} from '~/site/docs-shell/components/${name}';`)
      }
    }

    // Inject import statements as mdxjsEsm node
    if (imports.size > 0) {
      imports.forEach((importStatement) => {
        tree.children.unshift(createImportNode(importStatement))
      })
    }
  }
}
