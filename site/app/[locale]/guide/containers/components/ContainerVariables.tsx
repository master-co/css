import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'

const descriptions = {
  '3xs': 'Small component, compact card, or narrow popover.',
  '2xs': 'Compact panel and constrained media region.',
  xs: 'Small content module or sidebar-friendly component.',
  sm: 'Comfortable card, form block, or narrow reading panel.',
  md: 'Common component layout threshold.',
  lg: 'Wide component or compact page section.',
  xl: 'Large section, modal, or media composition.',
  '2xl': 'Small page wrapper or large split-pane region.',
  '3xl': 'Compact page canvas.',
  '4xl': 'Standard page canvas.',
  '5xl': 'Reading or documentation wrapper.',
  '6xl': 'Wide content wrapper.',
  '7xl': 'Maximum product canvas.'
}

export default () => {
  return <ThemeNumberVariableTable namespace="container" descriptions={descriptions} />
}
