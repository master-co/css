export function generateFileSchema(
    {
        aot,
        jit,
        moduleExports,
        typeSyntax,
        require
    }: {
        aot?: boolean,
        jit?: boolean,
        moduleExports?: boolean,
        typeSyntax?: boolean,
        require?: boolean
    }
) {
    const imports: Record<string, string[]> = {}
    const exports: Record<string, string> = {}
    const content: string[] = []
    const addImport = (key: string, value: string) => {
        if (key in imports) {
            if (typeof value === 'string') {
                imports[key].unshift(value)
            } else {
                imports[key].push(value)
            }
        } else {
            imports[key] = [value]
        }
    }

    // Config
    let config = `${moduleExports ? '' : 'export '}const config = {
    themes: {},
    colors: {},
    classes: {},
    values: {},
    semantics: {},
    breakpoints: {},
    selectors: {},
    mediaQueries: {}
}`
    if (typeSyntax) {
        config = `/** @type {import('@master/css').Config} */\n` + config
    } else if (!require) {
        addImport('@master/css', '{ Config }')
        config = config.replace(/ =/, ': Config$&')
    }
    content.push(config)
    exports['config'] = ''

    // JIT
    if (jit) {
        addImport('@master/css', 'MasterCSS')
        exports['css'] = 'new MasterCSS(config)'
    }

    // AOT
    if (aot) {
        let options = `${moduleExports ? '' : 'export '}const options = {
    sources: [],
    classes: {
        // whitelist of class names for unpredictable dynamics
        fixed: [],
        // blacklist of class names to exclude accidentally captured
        ignored: []  // or RegExp[]
    }
}`
        if (typeSyntax) {
            options = `/** @type {import('@master/css-compiler').Options} */\n` + options
        } else if (!require) {
            addImport('@master/css-compiler', '{ Options }')
            options = options.replace(/ =/, ': Options$&')
        }
        content.push(options)
        exports['options'] = ''
    }

    const importsEntries = Object.entries(imports)
    const exportEntries = Object.entries(exports)
    return (importsEntries.length
        ? importsEntries.map(([name, sources]) => (require ? `const ${sources.join(', ')} = require('${name}')` : `import ${sources.join(', ')} from '${name}'`)).join('\n') + '\n\n'
        : '')
        + content.join('\n\n')
        + '\n\n'
        + (moduleExports
            ? `module.exports = {\n    ${exportEntries.map(([name, value]) => value ? name + ': ' + value : name).join(',\n    ')}\n}`
            : exportEntries.filter(([, value]) => value).map(([name, value]) => `export const ${name} = ${value}`).join('\n'))
}