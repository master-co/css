import Code from '~/internal/components/Code'
import { createPresetEngine } from '../common/preset-css'

function normalizeClasses(classes: unknown) {
  const input = Array.isArray(classes) ? classes : [classes]
  return input.flatMap((classNames) => String(classNames ?? '').split(/\s+/).filter(Boolean))
}

const Class2CSS = (props: any) => {
  const { children: classes } = props
  const css = createPresetEngine()
  let generatedCSS: string
  try {
    css.ensureClassRules(normalizeClasses(classes))
    generatedCSS = css.snapshot().text
  } finally {
    css.dispose()
  }
  return (
    <Code {...props} lang="css" beautify>{generatedCSS}</Code>
  )
}

export default Class2CSS
