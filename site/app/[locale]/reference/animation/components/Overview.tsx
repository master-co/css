import SyntaxTable from 'internal/components/SyntaxTable'
import syntaxes from '../syntaxes'
import { IconBallTennis, IconBell, IconBellRinging, IconCircle, IconCurrentLocation, IconFocusCentered, IconHandFinger, IconHeart, IconLoader, IconLoader2, IconLoaderQuarter, IconMapPin, IconMaximize, IconPointer, IconSquare, IconStar, IconUfo } from '@tabler/icons-react'
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
                            'animation:fade': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:ping': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:flash': <IconStar className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:heart': <IconHeart className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:jump': <IconBallTennis className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:pulse': <IconHandFinger className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:rotate': <IconLoader className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:shake': <IconBell className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:zoom': <IconMaximize className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:float': <IconUfo className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:fade|1s|infinite|reverse': <IconCircle className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                            'animation:rotate|1s|infinite|linear|reverse': <IconLoader className={clsx('app-icon-primary contain:strict ml:-2 mr:3x stroke:1 vertical-align:top', syntax)} />,
                        }[syntax]}
                    </SyntaxTr>
                )
            }
            )}
        </SyntaxTable>
    )
}
