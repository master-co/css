import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'

const descriptions = {
  '4xs': 'Small phone and compact embedded surfaces.',
  '3xs': 'Large phone or narrow split-pane entry point.',
  '2xs': 'Small tablet, large modal, and compact app shell width.',
  'xs': 'Tablet portrait or roomy mobile layout.',
  'sm': 'Tablet landscape and small desktop layout.',
  'md': 'Default desktop shell threshold.',
  'lg': 'Wide desktop layout with stronger horizontal composition.',
  'xl': 'Large desktop or high-density canvas.',
  '2xl': 'Expanded workstation viewport.',
  '3xl': 'Very wide product or editorial canvas.',
  '4xl': 'Maximum viewport-oriented layout threshold.'
}

export default () => {
  return <ThemeNumberVariableTable namespace="breakpoint" descriptions={descriptions} />
}
