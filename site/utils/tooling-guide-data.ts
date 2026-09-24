import type { DocumentOption } from '../components/DocumentOptions'
import type { DocumentCodeExampleProps } from '../components/DocumentCodeExample'

export const toolingOptions = {
  rules: {
    label: 'Recommended lint rules',
    options: [
      { name: 'sort-classes', defaultValue: 'warn · fixable', description: 'Order and deduplicate class tokens.' },
      { name: 'no-invalid-classes', defaultValue: 'error · no automatic fix', description: 'Report recognized classes that emit invalid CSS.' },
      { name: 'no-conflicting-classes', defaultValue: 'warn · fixable', description: 'Resolve full or partial declaration overlaps in the same scope.' },
      { name: 'prefer-canonical-classes', defaultValue: 'warn · fixable', description: 'Prefer the active manifest’s utilities, tokens, aliases, and condition order.' }
    ]
  },
  canonical: {
    label: 'Canonical class options',
    options: [
      { name: 'preferStaticUtilities', defaultValue: 'true', description: 'Normalize named utilities only when their cascade identity is preserved.' },
      { name: 'preferPropertyAliases', defaultValue: 'true', description: 'Use shorter property keys: margin:1rem → m:1rem.' },
      { name: 'preferCompositionUtilities', defaultValue: 'true', description: 'Combine declarations only when value sources and cascade priorities are preserved.' },
      { name: 'preferConditionOrder', defaultValue: 'true', description: 'Normalize safe condition combinations: @dark@sm → @sm@dark.' },
      { name: 'preferNativeDeclarationsInCompose', defaultValue: 'true', description: 'Move declaration-like classes out of @compose into native CSS declarations.' },
      { name: 'preferVariantBlocksInCompose', defaultValue: 'true', description: 'Move conditional @compose classes into selector, @variant, or mode blocks.' }
    ]
  },
  lintSources: {
    label: 'ESLint class source settings',
    options: [
      { name: 'classAttributes', defaultValue: 'class, className', description: 'Markup attributes containing class strings.' },
      { name: 'classFunctions', defaultValue: 'clsx, cva, ctl, cv, class, classnames, classVariant, styled, classList.add/remove/toggle/replace', description: 'Class helper calls and tagged templates. The styled pattern also accepts member forms such as styled.button.' },
      { name: 'classDeclarations', defaultValue: '[]', description: 'Additional variable or object-property names containing class strings.' },
      { name: 'ignoredKeys', defaultValue: 'compoundVariants, defaultVariants', description: 'Object keys skipped while visiting variant configuration objects.' }
    ]
  },
  completions: {
    label: 'Selected completion results for p-',
    options: [
      { name: 'p-sm', description: '(token --spacing-sm) .75rem' },
      { name: 'p-md', description: '(token --spacing-md) 1rem' },
      { name: 'p-lg', description: '(token --spacing-lg) 1.5rem' }
    ]
  },
  languageSources: {
    label: 'Language service source settings',
    options: [
      { name: 'masterCSS.includedLanguages', description: 'Language IDs that receive the service’s features. Defaults include the web, framework, and content languages listed above.' },
      { name: 'masterCSS.classAttributes', defaultValue: 'class, className', description: 'Quoted markup attributes containing class lists.' },
      { name: 'masterCSS.classAttributeBindings', description: 'Defaults recognize JSX and template bindings, including :class, v-bind:class, [class], [className], [ngClass], and class:list.' },
      { name: 'masterCSS.classFunctions', defaultValue: 'clsx, cva, ctl, cv, class, classnames, classVariant, styled, classList.add/remove/toggle/replace', description: 'Helpers and tagged templates whose strings contain classes, including styled member forms.' },
      { name: 'masterCSS.classDeclarations', defaultValue: '[]', description: 'Additional variable or property names containing class strings.' },
      { name: 'masterCSS.exclude', defaultValue: '**/.git/**, **/node_modules/**, **/.hg/**', description: 'Paths excluded from language-service features.' }
    ]
  },
  languageSettings: {
    label: 'Language service feature settings',
    options: [
      { name: 'masterCSS.suggestSyntax', defaultValue: 'true', description: 'Offer contextual completion items.' },
      { name: 'masterCSS.inspectSyntax', defaultValue: 'true', description: 'Show generated CSS on hover.' },
      { name: 'masterCSS.renderSyntaxColors', defaultValue: 'true', description: 'Provide resolved color information to the editor.' },
      { name: 'masterCSS.formatDirectives', defaultValue: 'true', description: 'Normalize directive source in CSS-family files and supported style blocks.' },
      { name: 'masterCSS.embeddedSyntaxHighlighting', defaultValue: 'active', description: 'Choose active, always, or off for embedded class highlighting.' },
      { name: 'masterCSS.workspaces', defaultValue: 'auto', description: 'Discover project boundaries automatically, or supply workspace directory globs.' }
    ]
  }
} satisfies Record<string, { label: string, options: DocumentOption[] }>

export const toolingExamples = {
  sort: {
    title: 'A stable class order', language: 'mcss', sourceLabel: 'Before sorting', resultLabel: 'After sorting',
    source: 'bg-blue-60 p-md flex gap-sm', result: 'flex gap-sm p-md bg-blue-60'
  },
  invalid: {
    title: 'A recognized class with an invalid value', language: 'html',
    source: '<span class="text-decoration:bad()">Note</span>',
    diagnostic: { severity: 'Error', rule: '@master/css/no-invalid-classes', message: 'Class "text-decoration:bad()" emits invalid CSS: Invalid value for `text-decoration` property.' }
  },
  canonical: {
    title: 'Use the project vocabulary', language: 'mcss', sourceLabel: 'Before canonicalization', resultLabel: 'After canonicalization',
    source: 'margin:1rem fg-red@dark@sm', result: 'm:1rem fg-red@sm@dark'
  },
  conflict: {
    title: 'One intended margin', language: 'mcss', sourceLabel: 'Before fix', resultLabel: 'After fix',
    source: 'm-lg m-sm', result: 'm-sm',
    diagnostic: { severity: 'Warning', rule: '@master/css/no-conflicting-classes', message: 'Remove class "m-lg"; it is overridden by class "m-sm" in generated CSS.' }
  },
  raw: {
    title: 'A value that needs a token or an exception', language: 'mcss', source: 'font-size:15px',
    diagnostic: { severity: 'Warning', rule: '@master/css/no-unapproved-raw-values', message: 'Raw value "15px" is not approved for class "font-size:15px". Use a token or allow the value explicitly.' }
  },
  hover: {
    title: 'CSS reported by hover', language: 'html', resultLanguage: 'css', resultLabel: 'Hover output',
    source: '<button class="fg-white bg-blue-60:hover@sm">\n  Save\n</button>',
    result: '@layer theme {\n  :root,\n  :host {\n    --color-blue-60: oklch(51.83% .2687 266.1)\n  }\n}\n@layer utilities {\n  @media (width>=52.125rem) {\n    .bg-blue-60\\:hover\\@sm:hover {\n      background-color: var(--color-blue-60)\n    }\n  }\n}'
  },
  format: {
    title: 'Keep the important marker with its class', language: 'css', sourceLabel: 'Before formatting', resultLabel: 'After formatting',
    source: '.card {\n  @compose bg:transparent !;\n}', result: '.card {\n  @compose bg:transparent!;\n}'
  }
} satisfies Record<string, DocumentCodeExampleProps>

export function toolingOptionGroup(name: string) {
  if (!Object.hasOwn(toolingOptions, name)) throw new Error(`Unknown tooling options: ${name}`)
  return toolingOptions[name as keyof typeof toolingOptions]
}
export function toolingExample(name: string): DocumentCodeExampleProps {
  if (!Object.hasOwn(toolingExamples, name)) throw new Error(`Unknown tooling example: ${name}`)
  return toolingExamples[name as keyof typeof toolingExamples]
}
export function toolingOptionsMarkdown(name: string) {
  const group = toolingOptionGroup(name)
  return group.options.map((option: DocumentOption) => `- **${option.name}**${option.defaultValue === undefined ? '' : ` — default: \`${option.defaultValue}\``}. ${option.description}`).join('\n')
}
export function toolingExampleMarkdown(name: string) {
  const example = toolingExample(name)
  const fence = (label: string, language: string, code: string) => `${label}:\n\n\`\`\`${language}\n${code}\n\`\`\``
  return [example.title, fence(example.sourceLabel ?? 'Source', example.language, example.source),
    ...(example.diagnostic ? [`${example.diagnostic.severity} · \`${example.diagnostic.rule}\`: ${example.diagnostic.message}`] : []),
    ...(example.result === undefined ? [] : [fence(example.resultLabel ?? 'Result', example.resultLanguage ?? example.language, example.result)])
  ].join('\n\n')
}
