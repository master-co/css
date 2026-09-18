import { fileURLToPath } from 'node:url'
type Rule = {
  use?: unknown
  rules?: unknown[]
  oneOf?: unknown[]
  resourceQuery?: unknown
}
type Loader = { loader: string; options?: Record<string, unknown> }

function loaderName(value: unknown) {
  return typeof value === 'string' ? value : (value as Loader | undefined)?.loader ?? ''
}

const nextCSSLoader = /[/\\]next[/\\]dist[/\\]build[/\\]webpack[/\\]loaders[/\\](css-loader|postcss-loader|lightningcss-loader)[/\\]/
const nextSassLoader = /[/\\]next[/\\]dist[/\\]compiled[/\\]sass-loader[/\\]/

function expandedSassOptions(options: Record<string, unknown> = {}) {
  // Sass compression drops directive terminators before Master CSS can parse
  // them. Next still controls final CSS minification after directive lowering.
  return { ...options, style: 'expanded', outputStyle: 'expanded' }
}

// Keep Next's own CSS rules, conditions and loaders. Appending a separate CSS
// rule makes Next disable its CSS support, and cannot preserve Sass ordering.
export function composeWebpackStylesheets(rules: unknown[], stylesheetLoader: string, manifestQuery: RegExp) {
  function compose(value: unknown): { rule: unknown; changed: boolean } {
    if (!value || typeof value !== 'object') return { rule: value, changed: false }
    const original = value as Rule
    const rule = Object.create(Object.getPrototypeOf(original), Object.getOwnPropertyDescriptors(original)) as Rule
    let changed = false
    for (const key of ['rules', 'oneOf'] as const) {
      if (!original[key]) continue
      const children = original[key].map(compose)
      if (children.some(child => child.changed)) {
        rule[key] = children.map(child => child.rule)
        changed = true
      }
    }
    if (Array.isArray(original.use)) {
      const use = original.use
      const index = use.findIndex(item => /(?:postcss-loader|lightningcss-loader)/.test(loaderName(item)) && nextCSSLoader.test(loaderName(item)))
      if (index !== -1) {
        rule.use = use.flatMap((item, position) => {
          const name = loaderName(item)
          let loader = nextCSSLoader.test(name) && !name.includes('postcss-loader') && typeof item === 'object'
            ? { ...item, options: { ...item.options, importLoaders: Number(item.options?.importLoaders ?? 0) + 1 } }
            : item
          if (nextSassLoader.test(name) && typeof item === 'object') {
            const sassOptions = item.options?.sassOptions
            loader = { ...item, options: { ...item.options, sassOptions: typeof sassOptions === 'function'
              ? function(this: unknown, ...args: unknown[]) { return expandedSassOptions(sassOptions.apply(this, args)) }
              : expandedSassOptions(sassOptions) } }
          }
          return position === index ? [loader, { loader: stylesheetLoader, options: { preprocessed: true } }] : [loader]
        })
        rule.use = (rule.use as unknown[]).map(item => {
          const loader = item as Loader
          const name = loaderName(item)
          if (!nextCSSLoader.test(name)) return item
          if (name.includes('postcss-loader')) return { loader: fileURLToPath(new URL('./webpack-postcss-loader.js', import.meta.url)), options: { loader: loader.loader, options: loader.options ?? {} } }
          return { loader: fileURLToPath(new URL('./webpack-css-loader.js', import.meta.url)), options: { loader: loader.loader, options: loader.options ?? {} } }
        })
        changed = true
      }
    }
    return { rule: changed ? rule : value, changed }
  }
  return rules.map(value => {
    const result = compose(value)
    if (!result.changed) return value
    const rule = result.rule as Rule, exclusion = { not: [manifestQuery] }
    // Manifest requests produce JavaScript and must bypass the host CSS branch,
    // including its error/ignore/flight rules, while preserving existing queries.
    rule.resourceQuery = rule.resourceQuery === undefined ? exclusion : { and: [rule.resourceQuery, exclusion] }
    return rule
  })
}
