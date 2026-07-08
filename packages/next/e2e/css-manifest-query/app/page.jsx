import manifest from './master-css-manifest'

function getVariable(namespace, key) {
  return manifest.variables?.[namespace]?.find((variable) =>
    variable.key === key
    && !variable.mode
  )?.value
}

export default function Page() {
  const color = getVariable('color', 'e2e')
  const breakpoint = getVariable('breakpoint', 'fixture')

  return (
    <main data-color={color} data-breakpoint={breakpoint}>
      {color}:{breakpoint}
    </main>
  )
}
