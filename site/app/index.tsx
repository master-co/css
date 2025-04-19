'use client'

import type { App } from 'internal/contexts/app'
import { IconCompass, IconFileText, IconRoad, IconSourceCode, IconWriting } from '@tabler/icons-react'
import Logotype from 'internal/components/CSSLogotype'

export default {
    navs: [
        { name: 'Guide', href: '/guide', Icon: IconCompass },
        { name: 'Reference', fullName: 'API Reference', href: '/reference', Icon: IconFileText },
        { name: 'Blog', href: '/blog', Icon: IconWriting },
        { name: 'Play', href: '/play', Icon: IconSourceCode },
        // { name: 'Components', href: '/components', Icon: IconComponents, disabled: true },
        // { name: 'Templates', href: '/templates', disabled: true }
    ],
    versions: [
        { name: 'v1.37.3', href: 'https://css.master.co' }
    ],
    Logotype
} as App