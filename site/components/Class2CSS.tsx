import { useMemo } from 'react'
import Code from '~/internal/components/Code'
import { createPresetCSS } from '../common/preset-css'

function normalizeClasses(classes: unknown) {
    const input = Array.isArray(classes) ? classes : [classes]
    return input.flatMap((classNames) => String(classNames ?? '').split(/\s+/).filter(Boolean))
}

const Class2CSS = (props: any) => {
    const { children: classes } = props
    const generatedCSS = useMemo(() => {
        const css = createPresetCSS()
        normalizeClasses(classes).forEach((className) => css.ensureClassRules(className))
        return css.text
    }, [classes])
    return (
        <Code {...props} lang="css" beautify>{generatedCSS}</Code>
    )
}

export default Class2CSS
