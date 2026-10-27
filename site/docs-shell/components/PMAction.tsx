import CodeTabs from './CodeTabs'
import { resolveCommand } from 'package-manager-detector/commands'
import { ResolvedCommand } from 'package-manager-detector'

export default function PMAction({ children, action = 'install' }: any) {
  const code = (children?.props?.children || children)
  return (
    <CodeTabs localStorageKey='pm'>
      {['npm', 'pnpm', 'bun', 'yarn'].map((pm) => {
        const resolvedCommand = resolveCommand(pm as any, action, [code]) as ResolvedCommand
        if (resolvedCommand) {
          return {
            name: pm, lang: 'bash',
            code: resolvedCommand.command + ' ' + resolvedCommand.args.join(' '),
          }
        } else {
          return {
            name: pm, lang: 'bash',
            code: `${pm} ${action} ${code}`,
          }
        }
      })}
    </CodeTabs>
  )
}
