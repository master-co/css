import { expect, test } from 'vitest'

import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../src'

function decodeSemanticTokens(doc: ReturnType<typeof createDoc>, data: number[]) {
    const tokens: { text: string, type: string, modifiers: string[] }[] = []
    let line = 0
    let character = 0
    for (let i = 0; i < data.length; i += 5) {
        const deltaLine = data[i]
        const deltaStart = data[i + 1]
        line += deltaLine
        character = deltaLine === 0 ? character + deltaStart : deltaStart
        const length = data[i + 2]
        const type = SEMANTIC_TOKEN_TYPES[data[i + 3]]
        const modifierBits = data[i + 4]
        const start = doc.offsetAt({ line, character })
        const end = doc.offsetAt({ line, character: character + length })
        tokens.push({
            text: doc.getText().slice(start, end),
            type,
            modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
        })
    }
    return tokens
}

function renderTokens(content: string, ext: Parameters<typeof createDoc>[0] = 'tsx', settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
    const doc = createDoc(ext, content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'always', ...settings })
    const semanticTokens = languageService.renderSemanticTokens(doc)
    return {
        doc,
        tokens: decodeSemanticTokens(doc, semanticTokens?.data ?? [])
    }
}

function expectToken(tokens: { text: string, type: string, modifiers: string[] }[], text: string, type: string, modifiers: string[] = []) {
    expect(tokens).toContainEqual({ text, type, modifiers })
}

test.concurrent('renders semantic tokens for class attributes', () => {
    const { tokens } = renderTokens(
        '<div className="fg:brand:hover@sm block block:hover block:state-name hidden_div::before:of(.active) m:4x bg:rgb(0|0|0) w:10::scrollbar btn btn:hover@sm btn_div::before"></div>',
        'tsx',
        {
            config: {
                variables: [{ key: 'brand', value: '#123456' }],
                utilities: [
                    {
                        name: 'btn',
                        type: -4,
                        layer: 'components',
                        rules: [
                            { selector: '&', declarations: { color: 'var(--brand)' } },
                            { selector: '&', declarations: { display: 'block' } }
                        ]
                    }
                ]
            }
        }
    )

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, ':', 'operator')
    expectToken(tokens, 'brand', 'variable')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@sm', 'keyword', ['query'])
    expectToken(tokens, 'block', 'class')
    expectToken(tokens, 'state-name', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'hidden', 'class')
    expectToken(tokens, '_', 'operator', ['selector'])
    expectToken(tokens, 'div', 'type', ['selector'])
    expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector'])
    expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'of', 'modifier', ['pseudoClass'])
    expectToken(tokens, '.', 'operator', ['selector'])
    expectToken(tokens, 'active', 'class', ['selector'])
    expectToken(tokens, '4', 'number')
    expectToken(tokens, 'x', 'enumMember', ['unit'])
    expectToken(tokens, 'rgb', 'function')
    expectToken(tokens, 'scrollbar', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'btn', 'class', ['declaration', 'component'])
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration') && modifiers.includes('component'))).toHaveLength(3)
})

test.concurrent('renders semantic tokens for CSS-like values', () => {
    const { tokens } = renderTokens(
        '<div className="h:$size-sm fg:$color-blue-50/.5 content:x::before bg:rgb(0|0|0) fg:red_:where(a:hover) font:mono_:is(code,pre)@base font:semibold_:headings font:semibold_:is(h1,h2,h3,h4,h5,h6)"></div>',
        'tsx',
        {
            config: {
                variables: [
                    { key: 'size-sm', value: 16 },
                    { namespace: 'color', key: 'blue-50', value: 'oklch(60% 0.2 250)' }
                ]
            }
        }
    )

    expectToken(tokens, '$size-sm', 'variable')
    expectToken(tokens, '$color-blue-50', 'variable')
    expectToken(tokens, '/', 'operator')
    expectToken(tokens, '.5', 'number')
    expectToken(tokens, 'x', 'enumMember')
    expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector'])
    expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'rgb', 'function')
    expectToken(tokens, '|', 'operator')
    expectToken(tokens, '_', 'operator', ['selector'])
    expectToken(tokens, 'where', 'modifier', ['pseudoClass'])
    expectToken(tokens, '(', 'operator', ['selector'])
    expectToken(tokens, 'a', 'type', ['selector'])
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, ')', 'operator', ['selector'])
    expectToken(tokens, 'is', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'code', 'type', ['selector'])
    expectToken(tokens, ',', 'operator', ['selector'])
    expectToken(tokens, 'pre', 'type', ['selector'])
    expectToken(tokens, 'headings', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'h1', 'type', ['selector'])
    expectToken(tokens, 'h2', 'type', ['selector'])
    expectToken(tokens, 'h3', 'type', ['selector'])
    expectToken(tokens, 'h4', 'type', ['selector'])
    expectToken(tokens, 'h5', 'type', ['selector'])
    expectToken(tokens, 'h6', 'type', ['selector'])
    expectToken(tokens, '@base', 'keyword', ['query'])
})

test.concurrent('renders semantic tokens for container queries and slash-separated string values', () => {
    const { tokens } = renderTokens(
        '<div className="hidden@container(sm&<=md) container:card/inline-size grid-cols:2@card(3xs) bg:center/cover bg:url(/hero.jpg) hidden@media(pointer:coarse) hidden@h>=sm&h<lg"></div>',
        'html'
    )

    expectToken(tokens, 'hidden', 'class')
    expectToken(tokens, '@container', 'keyword', ['query'])
    expectToken(tokens, '(', 'operator', ['query'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, '&', 'operator', ['query'])
    expectToken(tokens, '<=', 'operator', ['query'])
    expectToken(tokens, 'md', 'enumMember', ['query'])
    expectToken(tokens, ')', 'operator', ['query'])
    expectToken(tokens, 'container', 'property')
    expectToken(tokens, 'card', 'enumMember')
    expectToken(tokens, '/', 'operator')
    expectToken(tokens, 'inline-size', 'enumMember')
    expectToken(tokens, 'grid-cols', 'property')
    expectToken(tokens, '2', 'number')
    expectToken(tokens, '@card', 'keyword', ['query'])
    expectToken(tokens, '3', 'number', ['query'])
    expectToken(tokens, 'xs', 'enumMember', ['query', 'unit'])
    expectToken(tokens, 'bg', 'property')
    expectToken(tokens, 'center', 'enumMember')
    expectToken(tokens, 'cover', 'enumMember')
    expectToken(tokens, 'url', 'function')
    expectToken(tokens, '/hero.jpg', 'string')
    expectToken(tokens, '@media', 'keyword', ['query'])
    expectToken(tokens, 'pointer', 'property', ['query'])
    expectToken(tokens, 'coarse', 'enumMember', ['query'])
    expectToken(tokens, '@h', 'keyword', ['query'])
    expectToken(tokens, '>=', 'operator', ['query'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, 'h', 'property', ['query'])
    expectToken(tokens, '<', 'operator', ['query'])
    expectToken(tokens, 'lg', 'enumMember', ['query'])
    expect(tokens.filter(({ text, type }) => text === '/' && type === 'operator')).toHaveLength(2)
})

test.concurrent('renders semantic tokens for grouped declarations, strings, units, and important marks', () => {
    const { tokens } = renderTokens(
        '<div class="{fg:red;bg:blue} translate(10x|20px) content:\'a|b\' size:10x20 fg:red!"></div>',
        'html'
    )

    expectToken(tokens, '{', 'operator')
    expectToken(tokens, ';', 'operator')
    expectToken(tokens, '}', 'operator')
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'bg', 'property')
    expectToken(tokens, 'blue', 'enumMember')
    expectToken(tokens, 'translate', 'function')
    expectToken(tokens, '10', 'number')
    expectToken(tokens, 'x', 'enumMember', ['unit'])
    expectToken(tokens, '20', 'number')
    expectToken(tokens, 'px', 'enumMember', ['unit'])
    expectToken(tokens, '\'', 'string', ['quoted'])
    expectToken(tokens, 'a|b', 'string', ['quoted'])
    expectToken(tokens, 'x', 'operator', ['unit'])
    expectToken(tokens, '!', 'operator', ['important'])
})

test.concurrent('renders semantic tokens for CSS directives', () => {
    const { tokens } = renderTokens(`
        @settings {
            root-size: 16;
        }

        @theme dark {
            color-primary: $color-blue-60/.8;
        }

        @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
        @custom-selector :interactive :is(:hover, :focus-visible);

        @animations {
            @keyframes fade {
                to {
                    opacity: 1;
                }
            }
        }

        @components {
            btn {
                @compose "inline-flex fg:primary:hover@md";
                @at dark {
                    @compose 'bg:surface';
                }
                @at <sm {
                    @compose "block";
                }
            }
        }
    `, 'css')

    expectToken(tokens, '@settings', 'keyword', ['directive'])
    expectToken(tokens, 'root-size', 'property')
    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expectToken(tokens, '.8', 'number')
    expectToken(tokens, '@custom-at', 'keyword', ['directive'])
    expectToken(tokens, 'motion-safe', 'variable', ['directive', 'query'])
    expectToken(tokens, '@media', 'keyword', ['query'])
    expectToken(tokens, '@custom-selector', 'keyword', ['directive'])
    expectToken(tokens, 'interactive', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@animations', 'keyword', ['directive'])
    expectToken(tokens, '@components', 'keyword', ['directive'])
    expectToken(tokens, 'btn', 'class', ['selector'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'primary', 'enumMember')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@md', 'keyword', ['query'])
    expectToken(tokens, '@at', 'keyword', ['directive'])
    expectToken(tokens, 'surface', 'enumMember')
    expectToken(tokens, ';', 'operator', ['directive'])
    expectToken(tokens, '<', 'operator', ['query'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, 'block', 'class')
})

test.concurrent('renders CSS directive ranges with quoted semicolons', () => {
    const { tokens } = renderTokens(`
        @source not "a;b.css";
        @source required "critical.tsx";
        @safelist "block fg:red";
        @blocklist "debug-*";
        @preserve native;

        .btn {
            @compose "fg:red";
        }

        @custom-at quoted @media (x: "a;b");
    `, 'css')

    expectToken(tokens, '@source', 'keyword', ['directive'])
    expectToken(tokens, 'not', 'modifier', ['directive'])
    expectToken(tokens, 'required', 'modifier', ['directive'])
    expectToken(tokens, 'a;b.css', 'string', ['quoted'])
    expectToken(tokens, 'critical.tsx', 'string', ['quoted'])
    expectToken(tokens, '@safelist', 'keyword', ['directive'])
    expectToken(tokens, 'block', 'class')
    expectToken(tokens, '@blocklist', 'keyword', ['directive'])
    expectToken(tokens, 'debug-*', 'string', ['quoted'])
    expectToken(tokens, '@preserve', 'keyword', ['directive'])
    expectToken(tokens, 'native', 'enumMember', ['directive'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, '@custom-at', 'keyword', ['directive'])
    expectToken(tokens, 'quoted', 'variable', ['directive', 'query'])
    expectToken(tokens, '@media', 'keyword', ['query'])
    expect(tokens.filter(({ text, type, modifiers }) =>
        text === ';' && type === 'operator' && modifiers.includes('directive')
    )).toHaveLength(7)
})

test.concurrent('renders inline theme modifier semantic tokens', () => {
    const { tokens } = renderTokens('@theme inline { color-primary: #123; }', 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'inline', 'modifier', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
})

test.concurrent('does not render non-entry @master at-rules as CSS directives', () => {
    const { tokens } = renderTokens(`
        @master shake;
        @master no-shake;
    `, 'css')

    expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword', modifiers: ['directive'] })
})

test.concurrent('renders CSS directives in SCSS-like sources without a CSS parser dependency', () => {
    const { tokens } = renderTokens(`
        $color: red;

        @theme {
            color-primary: #123;
        }

        .btn {
            @compose "block";
        }
    `, 'scss')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
    expectToken(tokens, '#123', 'enumMember')
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'block', 'class')
})

test.concurrent('does not synthesize a closing directive brace for incomplete CSS blocks', () => {
    const { tokens } = renderTokens('@theme { color-primary: red;', 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, '{', 'operator', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
    expectToken(tokens, 'red', 'enumMember')
    expect(tokens).not.toContainEqual({ text: ';', type: 'operator', modifiers: ['directive'] })
})

test.concurrent('shares class position detection with semantic token spans', () => {
    const doc = createDoc('tsx', 'const x = clsx("fg:red", condition && `block`)')
    const languageService = new CSSLanguageService()

    expect(languageService.getClassPositions(doc).map((classPosition) => classPosition.token)).toEqual([
        'fg:red',
        'block'
    ])
})

test.concurrent('renders active semantic tokens for the class context at a position', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('block') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'block', 'class')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
})

test.concurrent('renders active semantic tokens for a class context when the cursor is on whitespace', () => {
    const content = '<div className="fg:red block:hover p:md"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf(' block')))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'block', 'class')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'p', 'property')
    expectToken(tokens, 'md', 'enumMember')
})

test.concurrent('renders active semantic tokens only for the current class string context', () => {
    const content = 'const x = clsx("fg:red block", condition && "p:md flex")'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('flex') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'p', 'property')
    expectToken(tokens, 'md', 'enumMember')
    expectToken(tokens, 'flex', 'class')
    expect(tokens.some(({ text }) => text === 'fg' || text === 'red' || text === 'block')).toBe(false)
})

test.concurrent('skips full embedded semantic tokens in active mode', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'active' })

    expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
})

test.concurrent('renders active semantic tokens for the CSS directive at a position', () => {
    const content = '@theme dark { color-primary: $color-blue-60/.8; }\n.btn { color: red; }'
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('dark') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expect(tokens.some(({ text }) => text === 'btn')).toBe(false)
})

test.concurrent('skips embedded semantic tokens when syntax highlighting is off', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })

    expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
    expect(languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('block') + 1))).toBeUndefined()
})

test.concurrent('renders CSS document semantic tokens when syntax highlighting is off', () => {
    const content = '@theme dark { color-primary: $color-blue-60/.8; }\n.btn { color: red; }'
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })
    const semanticTokens = languageService.renderSemanticTokens(doc)
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, 'color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expectToken(tokens, 'btn', 'class', ['selector'])
})
