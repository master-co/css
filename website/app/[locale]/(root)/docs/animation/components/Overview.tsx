'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import { l } from 'to-line'
import { IconBallTennis, IconBell, IconBellRinging, IconCircle, IconCurrentLocation, IconFocusCentered, IconHandFinger, IconHeart, IconLoader, IconLoader2, IconLoaderQuarter, IconMapPin, IconMaximize, IconPointer, IconSquare, IconStar, IconUfo } from '@tabler/icons-react'

export default () =>
    <SyntaxTable value={syntaxes} previewClass={(eachClass: string) => {
        const className = 'app-icon-primary stroke:1 v:baseline my:-7 mr:12 ml:-2 r:2 contain:strict'
        if (eachClass.startsWith('@flash')) {
            return <IconStar className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@heart')) {
            return <IconHeart className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@pulse')) {
            return <IconHandFinger className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@zoom')) {
            return <IconMaximize className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@jump')) {
            return <IconBallTennis className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@shake')) {
            return <IconBell className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@rotate')) {
            return <IconLoader className={l(eachClass, className)} />
        }
        if (eachClass.startsWith('@float')) {
            return <IconUfo className={l(eachClass, className)} />
        }
        return <IconCircle className={l(eachClass, className)} />
    }}></SyntaxTable>