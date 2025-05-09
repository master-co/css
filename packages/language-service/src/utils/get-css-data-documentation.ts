import type { IPropertyData, IReference, IValueData, MarkupContent } from 'vscode-css-languageservice'
import beautifyCSS from './beautify-css'

export function getCSSDataDocumentation(data?: IPropertyData | IValueData, additional?: {
    generatedCSS?: string,
    docs?: string | false
}): MarkupContent | undefined {
    const values: string[] = []
    const references: IReference[] = data?.references ? [...data.references] : []
    if (data?.status) {
        values.push(getEntryStatus(data.status))
    }
    if (additional?.generatedCSS) {
        values.push(
            '```css\n'
            + beautifyCSS(additional.generatedCSS).split('\n').slice(1).join('\n')
            + '\n```'
        )
    }
    if (data?.description)
        if (typeof data.description === 'string') {
            values.push(textToMarkedString(data.description))
        } else {
            values.push(data.description.kind === 'markdown' ? data.description.value : textToMarkedString(data.description.value))
        }
    const browserLabel = getBrowserLabel(data?.browsers)
    if (browserLabel) {
        values.push('(' + textToMarkedString(browserLabel) + ')')
    }
    if (data && 'syntax' in data && data.syntax) {
        values.push(`Syntax: ${textToMarkedString(data.syntax)}`)
    }
    // todo: can i use
    if (additional?.docs) {
        references.unshift({
            name: 'Master CSS',
            url: new URL(additional.docs, 'https://rc.css.master.co').href
        })
    }
    if (references.length) {
        values.push(references.map((r: any) => {
            return `[${r.name}](${r.url})`
        }).join(' | '))
    }
    return values?.length ? {
        kind: 'markdown',
        value: values.join('\n\n')
    } : undefined
}

const browserNames = {
    E: 'Edge',
    FF: 'Firefox',
    S: 'Safari',
    C: 'Chrome',
    IE: 'IE',
    O: 'Opera'
}
function getEntryStatus(status: string) {
    switch (status) {
        case 'experimental':
            return '⚠️ Property is experimental. Be cautious when using it.️\n\n'
        case 'nonstandard':
            return '🚨️ Property is nonstandard. Avoid using it.\n\n'
        case 'obsolete':
            return '🚨️️️ Property is obsolete. Avoid using it.\n\n'
        default:
            return ''
    }
}

function textToMarkedString(text: string) {
    text = text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&') // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function getBrowserLabel(browsers: string[] = []): string | null {
    if (browsers.length === 0) {
        return null
    }

    return browsers
        .map(b => {
            let value = ''
            const matches = b.match(/([A-Z]+)(\d+)?/) ?? ''

            const name = matches[1]
            const version = matches[2]

            if (name in browserNames) {
                value += browserNames[name as keyof typeof browserNames]
            }
            if (version) {
                value += ' ' + version
            }
            return value
        })
        .join(', ')
}