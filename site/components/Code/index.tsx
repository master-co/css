import clsx from 'clsx'

// @ts-ignore
import * as Prism from 'prismjs/components/prism-core'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/plugins/treeview/prism-treeview'
import 'prismjs/plugins/treeview/prism-treeview.css'
import dedent from 'ts-dedent'
import React, { forwardRef, Ref, useEffect, useMemo, useRef } from 'react'
import CodeTabBar from './CodeTabBar'
import { isWindowOS } from '~/utils/isWindowOS'
import getCodeTokenRegex from '~/utils/getCodeTokenRegex'
import fixSelectorEscapeTokens from '~/utils/fixSelectorEscapeToken'
import { mcssLanguage } from '~/utils/mss.prism'

Prism.manual = true
Prism.hooks.add('after-tokenize', ({ language, tokens }: any) => {
    if (language === 'css') {
        fixSelectorEscapeTokens(tokens)
    }
})
Prism.languages['mss'] = mcssLanguage

const specialArrValue = (attrName: string, lang: string) => ({
    pattern: RegExp(
        /(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
        'i'
    ),
    lookbehind: true,
    inside: {
        'attr-name': /^[^\s=]+/,
        'attr-value': {
            pattern: /=[\s\S]+/,
            inside: {
                'value': {
                    pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                    lookbehind: true,
                    alias: [lang, 'language-' + lang],
                    inside: Prism.languages[lang]
                },
                'punctuation': [
                    {
                        pattern: /^=/,
                        alias: 'attr-equals'
                    },
                    /"|'/
                ],
                'value2': {
                    pattern: /(\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                    lookbehind: true,
                    alias: [lang, 'language-' + lang],
                    inside: Prism.languages[lang]
                },
            }
        }
    }
});

Object.defineProperty(Prism.languages.tsx.tag, 'addAttribute', {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function (attrName: string, lang: string) {
        Prism.languages.tsx.tag.inside['special-attr'].push(specialArrValue(attrName, lang));
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(Prism.languages.markup.tag, 'addAttribute2', {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function (attrName: string, lang: string) {
        Prism.languages.markup.tag.inside['special-attr'].push(specialArrValue(attrName, lang));
    },
    enumerable: true,
    configurable: true
});

const tsx = Prism.languages.tsx;
if (tsx) {
    tsx?.tag?.addAttribute?.('className', 'mss')
    tsx?.tag?.addAttribute?.('class', 'mss')
}
const markup = Prism.languages.markup;
if (markup) {
    markup?.tag?.addAttribute2?.('class', 'mss')
    markup?.tag?.addAttribute?.('className', 'mss')
}

const Code = (props: any, ref: any) => {
    const {
        inline,
        valid,
        invalid,
        warning,
        lineNumbers,
        name,
        tab,
        lang,
        lines,
        className,
        preClassName,
        tabBarClassName,
        active,
        addLines,
        removeLines,
        showControls,
        manual,
        children
    } = props
    const CodeElement = useMemo(() => {
        if (manual) {
            return (
                <code className={`language-${lang} white-space:pre min-w:fit`} ref={(el) => ref && (ref.current.code = el)}>
                    {children}
                </code>
            )
        } else {
            const getSpanReplacedFunc = (cls: string, tag = 'span') => (_: string, r1: string, r2: string, r3: string, r4: string, r5: string) => {
                return r4.startsWith('</')
                    ? `${r1}<${tag} class="${cls}">${r3}${r5}</${tag}>`
                    : `${r1}<${tag} class="${cls}">${r2}</${tag}>`;
            };
            const getNonSpanReplacedFunc = (cls: string, tag = 'span') => (_: string, r1: string, r2: string) => {
                return `${r1}<${tag} class="${cls}">${r2}</${tag}>`
            };
            let code: string =
                Prism.highlight(dedent(
                    (Array.isArray(children) ? children.join('') : children)
                        .trim()
                        .replace(/\~\~(.*?[^\s])\~\~/g, '')
                        .replace(/\\\{/g, 'FCURLYBRACKET')
                        .replace(/\\\}/g, 'BCURLYBRACKET')
                ), Prism.languages[lang], lang)
                    .replace(getCodeTokenRegex('*'), getSpanReplacedFunc('mark'))
                    .replace(getCodeTokenRegex('*', true), getNonSpanReplacedFunc('mark'))
                    .replace(/&lt;!--(.*?)-->/g, 'CoMmEnt$1CoMmEnt')
                    .replace(getCodeTokenRegex('-'), getSpanReplacedFunc('', 'del'))
                    .replace(getCodeTokenRegex('-', true), getNonSpanReplacedFunc('', 'del'))
                    .replace(getCodeTokenRegex('_'), getSpanReplacedFunc('silence'))
                    .replace(getCodeTokenRegex('_', true), getNonSpanReplacedFunc('silence'))
                    .replace(getCodeTokenRegex('+'), getSpanReplacedFunc('flash'))
                    .replace(getCodeTokenRegex('+', true), getNonSpanReplacedFunc('flash'))
                    .replace(getCodeTokenRegex('.'), '$1...')
                    .replace(getCodeTokenRegex('.', true), '$1...')
                    .replace(/CoMmEnt(.*?)CoMmEnt/g, '&lt;!--$1-->')
                    .replace(/FCURLYBRACKET/g, '\\{')
                    .replace(/BCURLYBRACKET/g, '\\}');
                    
            if (inline) {
                code = code.replace(/ClAsStAbLe(.*?)ClAsStAbLe/g, `<i class="f:fade f:gray-70@dark">$1</i>`)
            } else if (addLines || removeLines || lineNumbers || lang === 'bash') {
                code = code.split('\n')
                    .map((content, index: number) => {
                        let className = 'line'
                        if (addLines?.includes(index + 1)) {
                            className += ' bg:green-70/.08 content:\'+\'!:before f:green-70!:before'
                        }
                        if (removeLines?.includes(index + 1)) {
                            className += ' bg:red-70/.08 content:\'-\'!:before f:red-70!:before'
                        }
                        if (lang === 'bash') {
                            content = '<svg class="inline-block v:middle ml:-5 mr:5 fill:fade-78/.6 fill:gray-36@dark" viewBox="0 0 24 24" width="20" height="20"><path d="M13.071,12L9.25,8.179c-0.414-0.414-0.414-1.086,0-1.5l0,0c0.414-0.414,1.086-0.414,1.5,0l4.614,4.614 c0.391,0.391,0.391,1.024,0,1.414l-4.614,4.614c-0.414,0.414-1.086,0.414-1.5,0h0c-0.414-0.414-0.414-1.086,0-1.5L13.071,12z"/></svg>'
                                + content
                        }
                        return '<div class="' + className + '">' + content + '</div>'
                    })
                    .join('')
            }

            return (
                <code className={clsx('language-' + lang, 'white-space:pre min-w:fit', {
                    'f:regular': inline
                })}
                    ref={(el) => ref && (ref.current.code = el)} dangerouslySetInnerHTML={{ __html: code }}>
                </code>
            )
        }
    }, [addLines, children, inline, lang, lineNumbers, manual, ref, removeLines])

    useEffect(() => {
        if (ref?.current.pre && isWindowOS) {
            ref.current.pre.classList.add('scrollbar', 'bg:transparent!::scrollbar')
        }
    })

    return (
        inline
            ? CodeElement
            : <div className={clsx('code', className)}>
                {name && <CodeTabBar tabs={[props]} currentName={name} currentCode={children} className={tabBarClassName} showControls={showControls} />}
                {
                    (tab && active || !tab) &&
                    <pre ref={(el) => ref && (ref.current.pre = el)}
                        className={
                            clsx(
                                'highlight-pre',
                                {
                                    'bl:5|green-60|solid!:before': valid,
                                    'bl:5|crimson-60|solid!:before': invalid,
                                    'bl:5|orange-60|solid!:before': warning,
                                    'line-numbers': lineNumbers,
                                    'mt:0 rt:0! bt:0!': name || tab,
                                    lines
                                },
                                preClassName
                            )}
                    >
                        {CodeElement}
                    </pre>
                }
            </div>
    )
}

export default forwardRef(Code)

