import { useMemo } from 'react'
import { previewCSS } from '@master/css'
import Code from '~/internal/components/Code'
import presetCSS from '../common/preset-css'

function normalizeClasses(classes: unknown) {
    const input = Array.isArray(classes) ? classes : [classes]
    return input.flatMap((classNames) => String(classNames ?? '').split(/\s+/).filter(Boolean))
}

const Class2CSS = (props: any) => {
    const { children: classes } = props
    const generatedCSS = useMemo(() => {
        return previewCSS(presetCSS, normalizeClasses(classes))
    }, [classes])
    return (
        <Code {...props} lang="css" beautify>{generatedCSS}</Code>
    )
}

export default Class2CSS
