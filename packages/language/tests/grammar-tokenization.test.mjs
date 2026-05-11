// Shiki uses the same TextMate grammar shape consumed by VS Code. These smoke
// tests catch regex and injection regressions that pure JSON checks cannot.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHighlighter } from 'shiki'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const syntaxesDir = resolve(packageDir, 'syntaxes')
const theme = 'vitesse-light'

function readGrammar(file) {
    return JSON.parse(readFileSync(resolve(syntaxesDir, file), 'utf8'))
}

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function scopesOf(token) {
    return (token.explanation ?? []).flatMap((explanation) =>
        explanation.scopes.map((scope) => scope.scopeName)
    )
}

function tokensFor(highlighter, code, lang) {
    return highlighter.codeToTokens(code, {
        lang,
        theme,
        includeExplanation: true
    }).tokens.flat()
}

function assertTokenScope(tokens, content, scope) {
    assert.ok(
        tokens.some((token) => token.content === content && scopesOf(token).includes(scope)),
        `Expected token ${JSON.stringify(content)} to include ${scope}. Actual tokens:\n` +
        tokens.map((token) => `${JSON.stringify(token.content)} ${scopesOf(token).join(' ')}`).join('\n')
    )
}

function assertNoTokenScope(tokens, content, scope) {
    assert.equal(
        tokens.some((token) => token.content === content && scopesOf(token).includes(scope)),
        false,
        `Did not expect token ${JSON.stringify(content)} to include ${scope}`
    )
}

function assertTrimmedTokenScope(tokens, content, scope) {
    assert.ok(
        tokens.some((token) => token.content.trim() === content && scopesOf(token).includes(scope)),
        `Expected trimmed token ${JSON.stringify(content)} to include ${scope}. Actual tokens:\n` +
        tokens.map((token) => `${JSON.stringify(token.content)} ${scopesOf(token).join(' ')}`).join('\n')
    )
}

function assertNoTrimmedTokenScope(tokens, content, scope) {
    assert.equal(
        tokens.some((token) => token.content.trim() === content && scopesOf(token).includes(scope)),
        false,
        `Did not expect trimmed token ${JSON.stringify(content)} to include ${scope}`
    )
}

const coreGrammar = readGrammar('master-css.json')
const coreHighlighter = await createHighlighter({
    themes: [theme],
    langs: [coreGrammar]
})

const jsInjection = clone(readGrammar('master-css.injection-js.json'))
jsInjection.injectTo = ['source.js']
const classInjection = clone(readGrammar('master-css.injection-class.json'))
classInjection.injectTo = ['text.html.basic']
const reactInjection = clone(readGrammar('master-css.injection-react.json'))
reactInjection.injectTo = ['source.tsx']
const cssInjection = clone(readGrammar('master-css.injection-css.json'))
cssInjection.injectTo = ['source.css']
const embeddedHighlighter = await createHighlighter({
    themes: [theme],
    langs: [
        'css',
        'html',
        'js',
        'tsx',
        coreGrammar,
        classInjection,
        cssInjection,
        jsInjection,
        reactInjection
    ]
})

test('core grammar highlights Master CSS declaration, selector, and at tokens', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red:hover@sm', 'master-css')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, ':', 'punctuation.separator.key-value.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'hover', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, '@sm', 'keyword.control.at-rule')
})

test('core grammar highlights grouped declarations and separators', () => {
    const tokens = tokensFor(coreHighlighter, '{fg:red;bg:blue}', 'master-css')
    assertTokenScope(tokens, '{', 'punctuation.section.property-list.begin')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, ';', 'master-css.class.split')
    assertTokenScope(tokens, ';', 'punctuation.terminator.rule.css')
    assertTokenScope(tokens, 'bg', 'support.type.property-name.css')
    assertTokenScope(tokens, '}', 'punctuation.section.property-list.end')
})

test('core grammar highlights static class values without matching hyphenated prefixes', () => {
    const flexDirection = tokensFor(coreHighlighter, 'flex-col flex-row-reverse flex:row flex:1', 'master-css')
    assertTokenScope(flexDirection, 'flex-col', 'support.constant.property-value.css')
    assertTokenScope(flexDirection, 'flex-row-reverse', 'support.constant.property-value.css')
    assertTokenScope(flexDirection, 'flex', 'support.type.property-name.css')
    assertTokenScope(flexDirection, 'row', 'support.constant.property-value.css')
    assertTokenScope(flexDirection, '1', 'constant.numeric.css')
    assertNoTokenScope(flexDirection, 'flex', 'support.constant.property-value.css')

    const prefixed = tokensFor(coreHighlighter, 'block-start grid-cols:2', 'master-css')
    assertNoTokenScope(prefixed, 'block', 'support.constant.property-value.css')
    assertNoTokenScope(prefixed, 'grid', 'support.constant.property-value.css')
    assertTokenScope(prefixed, 'grid-cols', 'support.type.property-name.css')
})

test('core grammar highlights functions, numeric values, units, and value separators', () => {
    const tokens = tokensFor(coreHighlighter, 'translate(10x|20px)', 'master-css')
    assertTokenScope(tokens, 'translate', 'support.function.misc.css')
    assertTokenScope(tokens, '10', 'constant.numeric.css')
    assertTokenScope(tokens, 'x|', 'keyword.other.unit')
    assertTokenScope(tokens, 'x|', 'keyword.operator.css')
    assertTokenScope(tokens, '20', 'constant.numeric.css')
    assertTokenScope(tokens, 'px', 'keyword.other.unit')
})

test('core grammar aligns strings and selector separators with CSS-like scopes', () => {
    const stringValue = tokensFor(coreHighlighter, 'content:"hello"::before content:\'x\'::after', 'master-css')
    assertTokenScope(stringValue, '"hello"', 'string.quoted.double.html')
    assertTokenScope(stringValue, '\'x\'', 'string.quoted.single.html')

    const selector = tokensFor(coreHighlighter, 'fg:red:hover@sm fg:red:placeholder-showen block:hover block:state-name hidden_div::before:of(.active) fg:red_:where(a:hover) bg:blue-5:has(:checked) font:mono_:is(code,pre)@base font:semibold_:headings font:semibold_:heading-xl font:semibold_:is(h1,h2,h3,h4,h5,h6)', 'master-css')
    assertTokenScope(selector, '_', 'keyword.operator.combinator')
    assertTokenScope(selector, 'hover', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'placeholder-showen', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'block', 'support.constant.property-value.css')
    assertTokenScope(selector, 'state-name', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'hidden', 'support.constant.property-value.css')
    assertTokenScope(selector, 'div', 'entity.name.tag.css')
    assertTokenScope(selector, '::', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(selector, 'before', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(selector, 'of', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, '.active', 'entity.other.attribute-name.class.css')
    assertTokenScope(selector, 'where', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'a', 'entity.name.tag.css')
    assertTokenScope(selector, 'has', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'is', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'code', 'entity.name.tag.css')
    assertTokenScope(selector, 'pre', 'entity.name.tag.css')
    assertTokenScope(selector, 'headings', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(selector, 'heading-xl', 'entity.other.attribute-name.pseudo-class.css')
    assertNoTokenScope(selector, 'headings', 'support.constant.property-value.css')
    assertTokenScope(selector, 'h1', 'entity.name.tag.css')
    assertTokenScope(selector, 'h2', 'entity.name.tag.css')
    assertTokenScope(selector, 'h3', 'entity.name.tag.css')
    assertTokenScope(selector, 'h4', 'entity.name.tag.css')
    assertTokenScope(selector, 'h5', 'entity.name.tag.css')
    assertTokenScope(selector, 'h6', 'entity.name.tag.css')
    assertTokenScope(selector, ')', 'punctuation.section.function.end.bracket.round.css')
})

test('core grammar highlights plain variable references as value tokens', () => {
    const tokens = tokensFor(coreHighlighter, 'h:$size-sm font-size:$headline-size fg:$color-blue-50/.5', 'master-css')
    assertTokenScope(tokens, '$size-sm', 'variable.other.master-css.css')
    assertTokenScope(tokens, '$headline-size', 'variable.other.master-css.css')
    assertTokenScope(tokens, '$color-blue-50', 'variable.other.master-css.css')
    assertTokenScope(tokens, '/', 'keyword.operator.css')
    assertTokenScope(tokens, '.5', 'constant.numeric.css')
    assertNoTokenScope(tokens, '50', 'constant.numeric.css')
})

test('core grammar treats x as a unit only before non-letter boundaries', () => {
    const baseUnit = tokensFor(coreHighlighter, 'p:2x', 'master-css')
    assertTokenScope(baseUnit, 'x', 'keyword.other.unit')

    const tokenName = tokensFor(coreHighlighter, 'm:2xl font:2xs', 'master-css')
    assertTokenScope(tokenName, '2xl', 'support.constant.property-value.css')
    assertTokenScope(tokenName, '2xs', 'support.constant.property-value.css')
    assertNoTokenScope(tokenName, '2', 'constant.numeric.css')
    assertNoTokenScope(tokenName, 'x', 'keyword.other.unit')
    assertNoTokenScope(tokenName, 'x', 'master-css.class.x')

    const sizePair = tokensFor(coreHighlighter, 'size:10x20', 'master-css')
    assertTokenScope(sizePair, 'x', 'master-css.class.x')
    assertTokenScope(sizePair, 'x', 'keyword.operator.css')

    const mediaTokenName = tokensFor(coreHighlighter, '@media(width:2xl)', 'master-css')
    assertTokenScope(mediaTokenName, '2xl', 'support.constant.property-value.css')
    assertNoTokenScope(mediaTokenName, '2', 'constant.numeric.css')
    assertNoTokenScope(mediaTokenName, 'x', 'keyword.other.unit')

    const mediaResolution = tokensFor(coreHighlighter, '@media(resolution:2x)', 'master-css')
    assertTokenScope(mediaResolution, 'x', 'keyword.other.unit')
})

test('core grammar highlights dynamic pseudo class names', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red:placeholder-shown fg:red:placeholder-showen', 'master-css')
    assertTokenScope(tokens, 'placeholder-shown', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, 'placeholder-showen', 'entity.other.attribute-name.pseudo-class.css')
})

test('core grammar highlights file selector button pseudo element', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red::file-selector-button', 'master-css')
    assertTokenScope(tokens, '::', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'file-selector-button', 'entity.other.attribute-name.pseudo-element.css')
})

test('JS injection highlights configured class function strings only', () => {
    const highlighted = tokensFor(embeddedHighlighter, 'const x = clsx(\'fg:red hover\')', 'js')
    assertTokenScope(highlighted, 'fg', 'support.type.property-name.css')
    assertTokenScope(highlighted, 'red', 'support.constant.property-value.css')

    const plain = tokensFor(embeddedHighlighter, 'const plain = \'fg:red\'', 'js')
    assertNoTokenScope(plain, 'fg:red', 'support.type.property-name.css')
})

test('JS injection highlights DOM classList mutations', () => {
    const tokens = tokensFor(embeddedHighlighter, 'document.body.classList.add(\'fg:red\')', 'js')
    assertTokenScope(tokens, 'add', 'entity.name.function')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})

test('JS injection highlights tagged class templates', () => {
    const tokens = tokensFor(embeddedHighlighter, 'const x = clsx`fg:red`', 'js')
    assertTokenScope(tokens, 'clsx', 'entity.name.function')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})

test('React injection preserves quote scopes and highlights class attributes', () => {
    const single = tokensFor(embeddedHighlighter, '<div className=\'fg:red\'></div>', 'tsx')
    assertTokenScope(single, '\'', 'string.quoted.single.html')
    assertTokenScope(single, 'fg', 'support.type.property-name.css')

    const double = tokensFor(embeddedHighlighter, '<div className="fg:red"></div>', 'tsx')
    assertTokenScope(double, '"', 'string.quoted.double.html')
    assertTokenScope(double, 'red', 'support.constant.property-value.css')
})

test('React injection highlights class function calls inside attribute bindings', () => {
    const tokens = tokensFor(embeddedHighlighter, '<div className={clsx(\'fg:red\')}></div>', 'tsx')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})

test('HTML injection stops at the class attribute quote after selector suffixes', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        <div class="font:semibold_:headings font:semibold_:heading-xl">x</div>
        <div class="font:semibold_:is(h1,h2,h3,h4,h5,h6)">x</div>
        <div class="hidden_div::before:of(.active)">x</div>
        <article class="text:16_p@preset">
            <p class="text:24">24</p>
            <p>16</p>
        </article>
    `, 'html')

    assertTokenScope(tokens, 'text', 'support.type.property-name.css')
    assertTokenScope(tokens, '16', 'constant.numeric.css')
    assertTokenScope(tokens, '_', 'keyword.operator.combinator')
    assertTokenScope(tokens, 'p@preset', 'keyword.control.at-rule')
    assertTokenScope(tokens, 'headings', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, 'heading-xl', 'entity.other.attribute-name.pseudo-class.css')
    assertNoTokenScope(tokens, 'headings', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'h1', 'entity.name.tag.css')
    assertTokenScope(tokens, 'h2', 'entity.name.tag.css')
    assertTokenScope(tokens, 'h3', 'entity.name.tag.css')
    assertTokenScope(tokens, 'h4', 'entity.name.tag.css')
    assertTokenScope(tokens, 'h5', 'entity.name.tag.css')
    assertTokenScope(tokens, 'h6', 'entity.name.tag.css')
    assertNoTokenScope(tokens, 'h2', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'hidden', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'div', 'entity.name.tag.css')
    assertTokenScope(tokens, '::', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'before', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'of', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, '.active', 'entity.other.attribute-name.class.css')
    assertTokenScope(tokens, '"', 'punctuation.definition.string.end.html')
    assert.ok(
        tokens.some((token) => token.content === 'p'
            && scopesOf(token).includes('entity.name.tag.html')
            && !scopesOf(token).includes('string.quoted.double.html')),
        'Expected nested <p> tags to remain HTML after the class attribute closes'
    )
})

test('CSS injection highlights @master root configuration blocks', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        @master {
            root-size: 16;
            --color-primary: $color-blue-60/.8;

            dark {
                --color-primary: #818cf8;
            }

            @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
            @custom-selector :interactive :is(:hover, :focus-visible);
            @custom-selector ::scrollbar ::-webkit-scrollbar;
        }
    `, 'css')

    assertTokenScope(tokens, 'master', 'keyword.control.at-rule.master-css.css')
    assertTokenScope(tokens, 'root-size', 'support.type.property-name.css')
    assertTokenScope(tokens, '--color-primary', 'variable.css')
    assertTokenScope(tokens, 'color-blue-60', 'variable.other.master-css.css')
    assertTokenScope(tokens, '.8', 'constant.numeric.css')
    assertTokenScope(tokens, 'dark', 'entity.name.tag.css')
    assertTokenScope(tokens, 'custom-at', 'keyword.control.at-rule.custom-at.master-css.css')
    assertTokenScope(tokens, 'motion-safe', 'variable.parameter.master-css.at-token.css')
    assertTokenScope(tokens, 'media', 'keyword.control.at-rule.css')
    assertTokenScope(tokens, 'custom-selector', 'keyword.control.at-rule.custom-selector.master-css.css')
    assertTokenScope(tokens, ':interactive', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, '::scrollbar', 'entity.other.attribute-name.pseudo-element.css')
})

test('CSS injection highlights top-level extractor directives', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        @master shake;
        @master source './src/**/*.tsx';
        @master source exclude './src/**/*.test.tsx';
        @master source force './src/generated.tsx';
        @master class 'dialog-open bg:primary@dark';
        @master class exclude 'legacy-*';
    `, 'css')

    assertTokenScope(tokens, 'master', 'keyword.control.at-rule.master-css.css')
    assertTokenScope(tokens, 'shake', 'support.type.property-name.css')
    assertTokenScope(tokens, 'source', 'support.type.property-name.css')
    assertTokenScope(tokens, 'class', 'support.type.property-name.css')
    assertTokenScope(tokens, 'exclude', 'storage.modifier.master-css.css')
    assertTokenScope(tokens, 'force', 'storage.modifier.master-css.css')
    assertTokenScope(tokens, './src/**/*.tsx', 'string.quoted.single.css')
    assertTokenScope(tokens, 'bg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'primary', 'support.constant.property-value.css')
    assertTokenScope(tokens, '@dark', 'keyword.control.at-rule')
})

test('CSS injection highlights @master component directives and compose classes', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        @master {
            .btn {
                @compose "inline-flex fg:primary:hover@md";
                @at dark {
                    @compose 'bg:surface';
                }

                &:hover {
                    color: var(--color-primary);
                }

                &::scrollbar {
                    width: .25rem;
                }
            }
        }
    `, 'css')

    assertTokenScope(tokens, 'btn', 'entity.other.attribute-name.class.css')
    assertTokenScope(tokens, 'compose', 'keyword.control.at-rule.compose.master-css.css')
    assertTokenScope(tokens, 'inline-flex', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'hover', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, '@md', 'keyword.control.at-rule')
    assertTokenScope(tokens, 'at', 'keyword.control.at-rule.at.master-css.css')
    assertTokenScope(tokens, 'dark', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'bg', 'support.type.property-name.css')
    assertTokenScope(tokens, '&', 'entity.name.tag.css')
    assertTokenScope(tokens, '::', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'scrollbar', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'color', 'support.type.property-name.css')
})

test('CSS injection highlights declarations inside @master @layer general @at blocks', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        @master {
            @layer general {
                .content-auto {
                    content-visibility: auto;
                    contain-intrinsic-size: auto 32rem;
                }

                .print-hidden {
                    @at print {
                        display: none;
                    }
                }
            }
        }
    `, 'css')

    assertTokenScope(tokens, 'content-auto', 'entity.other.attribute-name.class.css')
    assertTokenScope(tokens, 'content-visibility', 'meta.property-name.css')
    assertTokenScope(tokens, 'contain-intrinsic-size', 'meta.property-name.css')
    assertTokenScope(tokens, 'print-hidden', 'entity.other.attribute-name.class.css')
    assertTokenScope(tokens, 'at', 'keyword.control.at-rule.at.master-css.css')
    assertTokenScope(tokens, 'print', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'display', 'support.type.property-name.css')
    assertTokenScope(tokens, 'none', 'support.constant.property-value.css')
})

test('CSS injection highlights @master native keyframes blocks', () => {
    const tokens = tokensFor(embeddedHighlighter, `
        @master {
            @keyframes fade-in {
                from {
                    opacity: 0;
                }

                50%,
                to {
                    opacity: .62;
                }
            }
        }
    `, 'css')

    assertTokenScope(tokens, 'keyframes', 'keyword.control.at-rule.css')
    assertTokenScope(tokens, 'from', 'entity.other.keyframe-offset.css')
    assertTokenScope(tokens, '50%', 'entity.other.keyframe-offset.percentage.css')
    assertTokenScope(tokens, 'to', 'entity.other.keyframe-offset.css')
    assertTokenScope(tokens, 'opacity', 'support.type.property-name.css')
})
