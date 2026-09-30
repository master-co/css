import Code from '~/site/docs-shell/components/Code'
import { generatePresetCSS } from '../common/generate-preset-css'
import GeneratedCSS from './GeneratedCSS'

function normalizeClasses(classes: unknown) {
  const input = Array.isArray(classes) ? classes : [classes]
  return input.flatMap((classNames) => String(classNames ?? '').split(/\s+/).filter(Boolean))
}

const Class2CSS = (props: any) => {
  const { children: classes } = props
  const generatedCSS = generatePresetCSS(normalizeClasses(classes))
  return (
    <GeneratedCSS><Code {...props} lang="css" beautify>{generatedCSS}</Code></GeneratedCSS>
  )
}

export default Class2CSS
