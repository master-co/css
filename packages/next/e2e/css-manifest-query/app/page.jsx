import { createHash } from 'node:crypto'
import manifest from './master-css-manifest'
import program from './master-css-program'

function getVariable(namespace, key) {
  return manifest.variables?.[namespace]?.find((variable) =>
    variable.key === key
    && !variable.mode
  )?.value
}

export default function Page() {
  const color = getVariable('color', 'e2e')
  const breakpoint = getVariable('breakpoint', 'fixture')
  const fontWeight = getVariable('font-weight', 'bold')

  return (
    <main
      data-color={color}
      data-breakpoint={breakpoint}
      data-font-weight={fontWeight}
      data-program-magic={Buffer.from(program.subarray(0, 4)).toString('latin1')}
      data-program-sha256={createHash('sha256').update(program).digest('hex')}
    >
      {color}:{breakpoint}
    </main>
  )
}
