import { extractLatentClasses, extractOxcClasses, type SourceAdapter, type SourceAdapterInput } from '@master/css-extractor'
import { parse } from 'vue/compiler-sfc'

function isVueSource(source: string) {
    return /\.vue(?:\?|$)/.test(source) && !/[?&]type=style(?:&|$)/.test(source)
}

export function extractVueClasses(source: string, content: string): string[] {
    const classes = new Set<string>()
    const { descriptor } = parse(content, { filename: source })

    const add = (classNames: string[]) => {
        for (const className of classNames) {
            if (className) classes.add(className)
        }
    }

    if (descriptor.template?.content) {
        add(extractLatentClasses(descriptor.template.content))
    }
    if (descriptor.script?.content) {
        add(extractOxcClasses(`${source}.${descriptor.script.lang || 'js'}`, descriptor.script.content))
    }
    if (descriptor.scriptSetup?.content) {
        add(extractOxcClasses(`${source}.${descriptor.scriptSetup.lang || 'js'}`, descriptor.scriptSetup.content))
    }

    return [...classes]
}

export function vueAdapter(): SourceAdapter {
    return {
        name: 'vue',
        test: isVueSource,
        extract({ source, content }: SourceAdapterInput) {
            return extractVueClasses(source, content)
        }
    }
}
