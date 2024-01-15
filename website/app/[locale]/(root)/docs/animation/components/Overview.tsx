import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import { IconBallTennis, IconBell, IconBellRinging, IconCircle, IconCurrentLocation, IconFocusCentered, IconHandFinger, IconHeart, IconLoader, IconLoader2, IconLoaderQuarter, IconMapPin, IconMaximize, IconPointer, IconSquare, IconStar, IconUfo } from '@tabler/icons-react'
import clsx from 'clsx'
import SyntaxTr from '~/components/SyntaxTr'

export default () => {
    const previewSyntax = ''
    return (
        <SyntaxTable scrollY={0}>
            {syntaxes.map((syntax) => {
                return (
                    <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
                        {typeof syntax === 'string' && {
                            '@fade|1s|infinite': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@fade|1s|infinite|reverse': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@ping|1s|infinite': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@flash|1s|infinite': <IconStar className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@heart|1s|infinite': <IconHeart className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@jump|1s|infinite': <IconBallTennis className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@pulse|1s|infinite': <IconHandFinger className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@rotate|1s|infinite|linear': <IconLoader className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@rotate|1s|infinite|linear|reverse': <IconLoader className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@shake|1s|infinite': <IconBell className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@zoom|1s|infinite': <IconMaximize className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />,
                            '@float|3s|ease-in-out|infinite': <IconUfo className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 v:top', syntax)} />
                        }[syntax]}
                    </SyntaxTr>
                )
            }
            )}
        </SyntaxTable>
    )
}