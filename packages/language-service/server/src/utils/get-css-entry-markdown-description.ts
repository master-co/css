import { MarkupKind } from 'vscode-languageserver'

export function getCssEntryMarkdownDescription(entry: any): string {
    if (!entry?.description || entry?.description === '') {
        return ''
    }

    let result: string = ''
    if (entry.status) {
        result += getEntryStatus(entry.status)
    }

    if (typeof entry.description === 'string') {
        result += textToMarkedString(entry.description)
    } else {
        result += entry.description.kind === MarkupKind.Markdown ? entry.description.value : textToMarkedString(entry.description.value)
    }

    const browserLabel = getBrowserLabel(entry.browsers)
    if (browserLabel) {
        result += '\n\n(' + textToMarkedString(browserLabel) + ')'
    }
    if ('syntax' in entry && entry.syntax) {
        result += `\n\nSyntax: ${textToMarkedString(entry.syntax)}`
    }
    if (entry.references && entry.references.length > 0) {
        if (result.length > 0) {
            result += '\n\n'
        }
        result += entry.references.map((r: any) => {
            return `[${r.name}](${r.url})`
        }).join(' | ')
    }

    return result
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
    text = text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function getBrowserLabel(browsers: string[] = []): string | null {
    if (browsers.length === 0) {
        return null
    }

    return browsers
        .map(b => {
            let result = ''
            const matches = b.match(/([A-Z]+)(\d+)?/)!

            const name = matches[1]
            const version = matches[2]

            if (name in browserNames) {
                result += browserNames[name as keyof typeof browserNames]
            }
            if (version) {
                result += ' ' + version
            }
            return result
        })
        .join(', ')
}