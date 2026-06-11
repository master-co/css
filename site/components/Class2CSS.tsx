import { useMemo } from 'react'
import Code from '~/internal/components/Code'
import { createPresetCSS } from '../common/preset-css'

const Class2CSS = (props: any) => {
    const { children: classes } = props
    const generatedCSS = useMemo(() => {
        const css = createPresetCSS()
        const input = Array.isArray(classes) ? classes : classes.split(' ')
        input.forEach((eachClass: string) => css.add(eachClass))
        return css.text
    }, [classes])
    return (
        <Code {...props} lang="css" beautify>{generatedCSS}</Code>
    )
}

export default Class2CSS
