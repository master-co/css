import SyntaxTable from 'internal/components/SyntaxTable'
import syntaxes from '../syntaxes'
import { IconBallTennis, IconBell, IconCircle, IconHandFinger, IconHeart, IconLoader, IconMaximize, IconStar, IconUfo } from '@tabler/icons-react'
import clsx from 'clsx'
import SyntaxTr from '~/site/components/SyntaxTr'

export default () => {
  const previewSyntax = ''
  return (
    <SyntaxTable>
      {syntaxes.map((syntax) => {
        return (
          <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
            {typeof syntax === 'string' && {
              'animate:fade': <IconCircle className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:ping': <IconCircle className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:flash': <IconStar className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:heart': <IconHeart className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:jump': <IconBallTennis className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:pulse': <IconHandFinger className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:rotate': <IconLoader className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:shake': <IconBell className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:zoom': <IconMaximize className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
              'animate:float': <IconUfo className={clsx('app-icon-primary ml:-0.125rem mr:sm contain:strict stroke:1 vertical-align:top', syntax)} />,
            }[syntax]}
          </SyntaxTr>
        )
      }
      )}
    </SyntaxTable>
  )
}
