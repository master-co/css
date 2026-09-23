// The shared auto-import plugin emits lexical imports that take precedence over
// useMDXComponents. Leave site-owned demo names to the site's MDX provider.
const legacyDemos = /^internal\/components\/(?:Demo|DemoPanel|DemoP|DemoLabel|BrowserHeader|IFrame|HelloWorld)$/

export default function remarkSiteDemos() {
  return tree => {
    tree.children = tree.children.filter(node => {
      const statements = node.data?.estree?.body
      return !(node.type === 'mdxjsEsm' && statements?.length === 1
        && statements[0].type === 'ImportDeclaration'
        && legacyDemos.test(statements[0].source.value))
    })
  }
}

const plugin = new URL('./demo-mdx.js', import.meta.url).pathname

function configureRule(rule) {
  if (Array.isArray(rule)) return rule.map(configureRule)
  if (!rule || typeof rule !== 'object') return rule
  const result = { ...rule }
  for (const key of ['loaders', 'use', 'rules', 'oneOf']) {
    if (result[key]) result[key] = configureRule(result[key])
  }
  if (result.options?.remarkPlugins && !result.options.remarkPlugins.includes(plugin)) {
    result.options = { ...result.options, remarkPlugins: [...result.options.remarkPlugins, plugin] }
  }
  return result
}

/** Extend the existing MDX pipeline without changing the shared submodule. */
export function withSiteDemos(config) {
  const webpack = config.webpack
  return {
    ...config,
    turbopack: {
      ...config.turbopack,
      rules: Object.fromEntries(Object.entries(config.turbopack?.rules ?? {}).map(([name, rule]) => [name, configureRule(rule)])),
    },
    async webpack(...args) {
      const result = webpack ? await webpack(...args) : args[0]
      result.module.rules = result.module.rules.map(configureRule)
      return result
    },
  }
}
